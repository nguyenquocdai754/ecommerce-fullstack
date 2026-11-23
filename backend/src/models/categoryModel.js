const db = require("../config/database");

const getAll = async () => {
  const [rows] = await db.query(
    "SELECT id, name FROM categories WHERE status = 'ACTIVE' ORDER BY name ASC",
  );
  return rows;
};

const getAllForManagement = async () => {
  const [rows] = await db.query("SELECT id, name, description, status FROM categories ORDER BY name ASC");
  return rows;
};

const create = async (name, description) => {
  const [result] = await db.execute("INSERT INTO categories (name, description) VALUES (?, ?)", [name, description || null]);
  return result.insertId;
};

const update = async (id, name, description) => db.execute("UPDATE categories SET name = ?, description = ? WHERE id = ?", [name, description || null, id]);

const setStatus = async (id, status) => db.execute("UPDATE categories SET status = ? WHERE id = ?", [status, id]);

module.exports = { getAll, getAllForManagement, create, update, setStatus };
