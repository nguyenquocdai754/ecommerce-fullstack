const pool = require("../config/database");

const getForBook = async (bookId) => {
  const [rows] = await pool.execute(
    `SELECT r.id, r.user_id, r.rating, r.title, r.comment, r.created_at,
            u.full_name
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.book_id = ? AND r.status = 'VISIBLE' ORDER BY r.created_at DESC`,
    [bookId],
  );
  return rows;
};

const getMine = async (userId, bookId) => {
  const [rows] = await pool.execute(
    `SELECT id, book_id, user_id, rating, title, comment, status, created_at
     FROM reviews WHERE user_id = ? AND book_id = ? LIMIT 1`,
    [userId, bookId],
  );
  return rows[0] || null;
};

const canReview = async (userId, bookId) => {
  const [rows] = await pool.execute(
    `SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = ? AND oi.book_id = ? AND o.status IN ('DELIVERED', 'COMPLETED') LIMIT 1`,
    [userId, bookId],
  );
  return rows.length > 0;
};

const create = async (userId, bookId, rating, title, comment) => {
  const [result] = await pool.execute(
    `INSERT INTO reviews (user_id, book_id, rating, title, comment)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, bookId, rating, title || null, comment.trim()],
  );
  return result.insertId;
};

const getAllForManagement = async () => {
  const [rows] = await pool.execute(
    `SELECT r.id, r.book_id, b.title AS book_title, u.full_name, r.rating,
            r.title, r.comment, r.status, r.created_at
     FROM reviews r JOIN books b ON b.id = r.book_id JOIN users u ON u.id = r.user_id
     ORDER BY r.created_at DESC`,
  );
  return rows;
};

const setStatus = async (id, status) => pool.execute("UPDATE reviews SET status = ? WHERE id = ?", [status, id]);
const deleteForManagement = async (id) => pool.execute("DELETE FROM reviews WHERE id = ?", [id]);

const updateMine = async (userId, id, rating, title, comment) => pool.execute(
  "UPDATE reviews SET rating = ?, title = ?, comment = ? WHERE id = ? AND user_id = ?",
  [rating, title || null, comment, id, userId],
);

const deleteMine = async (userId, id) => pool.execute("DELETE FROM reviews WHERE id = ? AND user_id = ?", [id, userId]);

module.exports = { getForBook, getMine, canReview, create, getAllForManagement, setStatus, deleteForManagement, updateMine, deleteMine };
