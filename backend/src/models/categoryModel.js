const db = require("../config/database");

const getAll = async () => {
  const [rows] = await db.query(
    "SELECT id, name FROM categories ORDER BY name ASC",
  );
  return rows;
};

module.exports = { getAll };
