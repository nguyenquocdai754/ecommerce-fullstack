const pool = require("../config/database");

const createOrder = async (userId, input) => {
  const { items, recipient, phone, address, note, paymentMethod } = input;
  const shippingMethod = input.shippingMethod || "STANDARD";
  if (!Array.isArray(items) || !items.length || items.length > 50) {
    const error = new Error("Giỏ hàng không hợp lệ.");
    error.status = 400;
    throw error;
  }
  if (!["COD", "ONLINE"].includes(paymentMethod)) {
    const error = new Error("Phương thức thanh toán không hợp lệ.");
    error.status = 400;
    throw error;
  }
  if (!["STANDARD", "EXPRESS"].includes(shippingMethod)) {
    const error = new Error("Phương thức vận chuyển không hợp lệ.");
    error.status = 400;
    throw error;
  }
  if (typeof recipient !== "string" || !recipient.trim() || recipient.length > 120 || typeof phone !== "string" || !/^\+?[0-9]{10,15}$/.test(phone.trim()) || typeof address !== "string" || !address.trim() || address.length > 2000 || String(note || "").length > 1000) {
    const error = new Error("Vui lòng nhập đủ thông tin nhận hàng.");
    error.status = 400;
    throw error;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    let total = 0;
    const orderItems = [];
    const merged = new Map();
    for (const item of items) {
      const id = Number(item.id);
      const quantity = Number(item.quantity);
      if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0) {
        const error = new Error("Sản phẩm hoặc số lượng không hợp lệ.");
        error.status = 400;
        throw error;
      }
      merged.set(id, (merged.get(id) || 0) + quantity);
    }
    for (const [id, quantity] of merged) {
      const [rows] = await connection.execute(
        "SELECT b.id, b.title, b.price, b.stock FROM books b JOIN categories c ON c.id = b.category_id WHERE b.id = ? AND b.status = 'ACTIVE' AND c.status = 'ACTIVE' FOR UPDATE",
        [id],
      );
      const book = rows[0];
      if (!book || Number(book.stock) < quantity) {
        const error = new Error(`Sách #${id} không đủ tồn kho.`);
        error.status = 409;
        throw error;
      }
      const price = Number(book.price);
      total += price * quantity;
      orderItems.push({ id, quantity, price });
      await connection.execute("UPDATE books SET stock = stock - ? WHERE id = ?", [quantity, id]);
    }
    const subtotal = total;
    const shippingFee = shippingMethod === "EXPRESS" ? 45000 : subtotal >= 150000 ? 0 : 25000;
    total = subtotal + shippingFee;
    const status = paymentMethod === "ONLINE" ? "PENDING_PAYMENT" : "PENDING";
    const [orderResult] = await connection.execute(
      `INSERT INTO orders
       (user_id, total_amount, status, shipping_address, recipient_name,
        recipient_phone, note, payment_method, payment_status, shipping_method, shipping_fee)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [userId, total, status, address.trim(), recipient.trim(), phone.trim(), String(note || "").trim(), paymentMethod, "UNPAID", shippingMethod, shippingFee],
    );
    for (const item of orderItems) {
      await connection.execute(
        "INSERT INTO order_items (order_id, book_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderResult.insertId, item.id, item.quantity, item.price],
      );
    }
    if (paymentMethod === "ONLINE") {
      await connection.execute(
        "INSERT INTO payments (order_id, method, amount, status) VALUES (?, 'SIMULATED', ?, 'PENDING')",
        [orderResult.insertId, total],
      );
    }
    await connection.execute(
      "INSERT INTO order_status_histories (order_id, status, note) VALUES (?, ?, ?)",
      [orderResult.insertId, status, "Đơn hàng được tạo"],
    );
    await connection.commit();
    return { id: orderResult.insertId, subtotal, shippingFee, total, status, paymentMethod, shippingMethod };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getMine = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT o.id, o.total_amount, o.status, o.payment_method, o.payment_status,
            o.created_at, o.recipient_name,
            (SELECT b.title FROM order_items oi JOIN books b ON b.id = oi.book_id
             WHERE oi.order_id = o.id ORDER BY oi.id LIMIT 1) AS first_book
     FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC`,
    [userId],
  );
  return rows;
};

const getById = async (id, user) => {
  const params = [id];
  let ownership = "";
  if (user.role === "CUSTOMER") {
    ownership = "AND o.user_id = ?";
    params.push(user.id);
  }
  const [rows] = await pool.execute(
    `SELECT o.* FROM orders o WHERE o.id = ? ${ownership} LIMIT 1`,
    params,
  );
  if (!rows.length) return null;
  const [items] = await pool.execute(
    `SELECT oi.book_id AS id, b.title AS name, b.cover_image AS thumbnail,
            oi.quantity, oi.price
     FROM order_items oi JOIN books b ON b.id = oi.book_id WHERE oi.order_id = ?`,
    [id],
  );
  const [history] = await pool.execute(
    "SELECT status, note, created_at FROM order_status_histories WHERE order_id = ? ORDER BY id",
    [id],
  );
  return { ...rows[0], items, history };
};

const cancelOrder = async (orderId, userId, reason) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id, status FROM orders WHERE id = ? AND user_id = ? FOR UPDATE",
      [orderId, userId],
    );
    if (!rows.length) {
      const error = new Error("Không tìm thấy đơn hàng.");
      error.status = 404;
      throw error;
    }
    if (!["PENDING", "PENDING_PAYMENT", "CONFIRMED"].includes(rows[0].status)) {
      const error = new Error("Đơn hàng hiện không thể hủy.");
      error.status = 409;
      throw error;
    }
    const [items] = await connection.execute("SELECT book_id, quantity FROM order_items WHERE order_id = ?", [orderId]);
    for (const item of items) {
      await connection.execute("UPDATE books SET stock = stock + ? WHERE id = ?", [item.quantity, item.book_id]);
    }
    await connection.execute(
      "UPDATE orders SET status = 'CANCELLED', payment_status = IF(payment_status = 'PAID', 'REFUNDED', 'CANCELLED'), cancel_reason = ? WHERE id = ?",
      [String(reason || "Khách hàng yêu cầu hủy").trim().slice(0, 500), orderId],
    );
    await connection.execute("UPDATE payments SET status = 'CANCELLED' WHERE order_id = ? AND status IN ('PENDING', 'FAILED', 'PAID')", [orderId]);
    await connection.execute(
      "INSERT INTO order_status_histories (order_id, status, note) VALUES (?, 'CANCELLED', ?)",
      [orderId, String(reason || "Khách hàng yêu cầu hủy").trim().slice(0, 500)],
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const confirmReceived = async (orderId, userId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT status FROM orders WHERE id = ? AND user_id = ? FOR UPDATE", [orderId, userId]);
    if (!rows.length) { const error = new Error("Không tìm thấy đơn hàng."); error.status = 404; throw error; }
    if (rows[0].status !== "DELIVERED") { const error = new Error("Chỉ xác nhận đơn đã giao."); error.status = 409; throw error; }
    await connection.execute("UPDATE orders SET status = 'COMPLETED' WHERE id = ?", [orderId]);
    await connection.execute("INSERT INTO order_status_histories (order_id, status, note) VALUES (?, 'COMPLETED', 'Khách hàng xác nhận đã nhận hàng')", [orderId]);
    await connection.commit();
    return true;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
};

const getManagementOrders = async () => {
  const [rows] = await pool.execute(
    `SELECT o.id, o.user_id, u.full_name, o.total_amount, o.status,
            o.payment_method, o.payment_status, o.created_at
     FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC`,
  );
  return rows;
};

const updateStatus = async (orderId, nextStatus) => {
  const transitions = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    PENDING_PAYMENT: ["CANCELLED"],
    CONFIRMED: ["PREPARING", "CANCELLED"],
    PREPARING: ["SHIPPING", "CANCELLED"],
    SHIPPING: ["DELIVERED"],
    DELIVERED: ["COMPLETED"],
  };
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT status, payment_method FROM orders WHERE id = ? FOR UPDATE", [orderId]);
    if (!rows.length) {
      const error = new Error("Không tìm thấy đơn hàng.");
      error.status = 404;
      throw error;
    }
    if (!(transitions[rows[0].status] || []).includes(nextStatus)) {
      const error = new Error("Không thể chuyển sang trạng thái này.");
      error.status = 409;
      throw error;
    }
    if (nextStatus === "CANCELLED") {
      const [items] = await connection.execute("SELECT book_id, quantity FROM order_items WHERE order_id = ?", [orderId]);
      for (const item of items) await connection.execute("UPDATE books SET stock = stock + ? WHERE id = ?", [item.quantity, item.book_id]);
      await connection.execute("UPDATE orders SET payment_status = IF(payment_status = 'PAID', 'REFUNDED', 'CANCELLED') WHERE id = ?", [orderId]);
      await connection.execute("UPDATE payments SET status = 'CANCELLED' WHERE order_id = ? AND status IN ('PENDING', 'FAILED', 'PAID')", [orderId]);
    }
    if (nextStatus === "DELIVERED" && rows[0].payment_method === "COD") {
      await connection.execute("UPDATE orders SET status = ?, payment_status = 'PAID' WHERE id = ?", [nextStatus, orderId]);
      await connection.execute(
        "INSERT INTO payments (order_id, method, amount, status, transaction_code, paid_at) SELECT id, 'COD', total_amount, 'PAID', ?, CURRENT_TIMESTAMP FROM orders WHERE id = ?",
        [`COD-${orderId}-${Date.now()}`, orderId],
      );
    } else {
      await connection.execute("UPDATE orders SET status = ? WHERE id = ?", [nextStatus, orderId]);
    }
    await connection.execute("INSERT INTO order_status_histories (order_id, status, note) VALUES (?, ?, ?)", [orderId, nextStatus, "Cập nhật bởi quản lý"]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { createOrder, getMine, getById, cancelOrder, confirmReceived, getManagementOrders, updateStatus };
