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
    c.name AS category_name
  FROM books b
  LEFT JOIN categories c ON b.category_id = c.id
`;

const getAll = async () => {
  const [rows] = await db.query(`${selectBooks} ORDER BY b.id ASC`);
  return rows;
};

const getById = async (book_id) => {
  const [rows] = await db.query(`${selectBooks} WHERE b.id = ? LIMIT 1`, [
    book_id,
  ]);
  return rows[0] || null;
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

module.exports = { getAll, getById, create, update, remove };
