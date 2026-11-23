const db = require("../config/database");

const selectBooks = `
  SELECT
    b.id AS book_id,
    b.title,
    b.author,
    b.price,
    b.stock,
    b.description,
    b.cover_image AS image,
    b.category_id,
    c.name AS category_name,
    b.status
    , (SELECT AVG(r.rating) FROM reviews r WHERE r.book_id = b.id AND r.status = 'VISIBLE') AS average_rating
    , (SELECT COUNT(*) FROM reviews r WHERE r.book_id = b.id AND r.status = 'VISIBLE') AS review_count
    , (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.book_id = b.id AND o.status <> 'CANCELLED') AS sold_count
  FROM books b
  LEFT JOIN categories c ON b.category_id = c.id
`;

const getAll = async (filters = {}) => {
  const clauses = ["b.status = 'ACTIVE'", "c.status = 'ACTIVE'"];
  const values = [];
  if (filters.q) {
    clauses.push("(b.title LIKE ? OR b.author LIKE ? OR b.description LIKE ? OR c.name LIKE ?)");
    const term = `%${String(filters.q).trim().slice(0, 100)}%`;
    values.push(term, term, term, term);
  }
  if (filters.categoryId) {
    clauses.push("b.category_id = ?");
    values.push(Number(filters.categoryId));
  }
  if (filters.minPrice !== undefined && filters.minPrice !== "") {
    clauses.push("b.price >= ?");
    values.push(Number(filters.minPrice));
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== "") {
    clauses.push("b.price <= ?");
    values.push(Number(filters.maxPrice));
  }
  if (filters.inStock === "true") clauses.push("b.stock > 0");
  const sorting = {
    newest: "b.created_at DESC",
    price_up: "b.price ASC",
    price_down: "b.price DESC",
    name: "b.title ASC",
    name_desc: "b.title DESC",
  }[filters.sort] || "b.id ASC";
  const [rows] = await db.execute(
    `${selectBooks}
     WHERE ${clauses.join(" AND ")}
     ORDER BY ${sorting}`,
    values,
  );
  return rows;
};

const getById = async (book_id) => {
  const [rows] = await db.query(`${selectBooks} WHERE b.id = ? AND b.status = 'ACTIVE' AND c.status = 'ACTIVE' LIMIT 1`, [
    book_id,
  ]);
  return rows[0] || null;
};

const getAllForManagement = async () => {
  const [rows] = await db.query(`${selectBooks} ORDER BY b.updated_at DESC`);
  return rows;
};

const setStatus = async (id, status) => db.execute("UPDATE books SET status = ? WHERE id = ?", [status, id]);

const getImages = async (bookId) => {
  const [rows] = await db.execute("SELECT id, image_url, sort_order FROM book_images WHERE book_id = ? ORDER BY sort_order, id", [bookId]);
  return rows;
};

const setImages = async (bookId, imageUrls) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [books] = await connection.execute("SELECT id FROM books WHERE id = ? FOR UPDATE", [bookId]);
    if (!books.length) { const error = new Error("Không tìm thấy sản phẩm."); error.status = 404; throw error; }
    await connection.execute("DELETE FROM book_images WHERE book_id = ?", [bookId]);
    for (let index = 0; index < imageUrls.length; index += 1) {
      await connection.execute("INSERT INTO book_images (book_id, image_url, sort_order) VALUES (?, ?, ?)", [bookId, imageUrls[index], index]);
    }
    await connection.commit();
    return getImages(bookId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
};

const create = async (
  title,
  price,
  stock,
  image,
  description,
  category_id,
  author,
) => {
  const [result] = await db.query(
    `INSERT INTO books (title, price, stock, cover_image, description, category_id, author)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, price, stock, image, description, category_id, author],
  );
  return result;
};

const update = async (
  book_id,
  title,
  price,
  stock,
  image,
  description,
  category_id,
  author,
) => {
  const [result] = await db.query(
    `UPDATE books
     SET title = ?, price = ?, stock = ?, cover_image = ?, description = ?, category_id = ?, author = ?
     WHERE id = ?`,
    [title, price, stock, image, description, category_id, author, book_id],
  );
  return result;
};

const remove = async (book_id) => {
  const [result] = await db.query("DELETE FROM books WHERE id = ?", [book_id]);
  return result;
};

module.exports = { getAll, getAllForManagement, getById, getImages, setImages, create, update, remove, setStatus };
