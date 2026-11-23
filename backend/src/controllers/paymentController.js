const pool = require("../config/database");

const simulatedResult = async (req, res, next) => {
  const orderId = Number(req.params.orderId);
  const result = req.body.result;
  if (!Number.isSafeInteger(orderId) || !["SUCCESS", "FAILED"].includes(result)) {
    return res.status(400).json({ success: false, message: "Kết quả thanh toán không hợp lệ." });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute(
      "SELECT id, status FROM orders WHERE id = ? AND user_id = ? FOR UPDATE",
      [orderId, req.user.id],
    );
    if (!orders.length || orders[0].status !== "PENDING_PAYMENT") {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch chờ thanh toán." });
    }
    const paymentStatus = result === "SUCCESS" ? "PAID" : "FAILED";
    const orderStatus = result === "SUCCESS" ? "CONFIRMED" : "PENDING_PAYMENT";
    const transactionCode = `DEMO-${orderId}-${Date.now()}`;
    await connection.execute(
      "UPDATE payments SET status = ?, transaction_code = ?, paid_at = IF(? = 'PAID', CURRENT_TIMESTAMP, NULL) WHERE order_id = ?",
      [paymentStatus, transactionCode, paymentStatus, orderId],
    );
    await connection.execute("UPDATE orders SET status = ?, payment_status = ? WHERE id = ?", [orderStatus, paymentStatus, orderId]);
    await connection.execute("INSERT INTO order_status_histories (order_id, status, note) VALUES (?, ?, ?)", [orderId, orderStatus, result === "SUCCESS" ? "Thanh toán mô phỏng thành công" : "Thanh toán mô phỏng thất bại"]);
    await connection.commit();
    return res.json({ success: true, data: { orderId, paymentStatus, orderStatus, transactionCode } });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
};

module.exports = { simulatedResult };
