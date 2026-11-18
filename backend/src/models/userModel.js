const pool = require("../config/database");

const getUserId = async (id) => {
  const [rows] = await pool.execute(`SELECT * FROM users WHERE id = ?`, [id]);
  return rows[0];
};

const getUserByEmail = async (email) => {
  const [rows] = await pool.execute(`SELECT * FROM users WHERE email = ?`, [
    email,
  ]);
  return rows;
};

// Thêm hàm findForLogin phục vụ riêng cho luồng Đăng nhập
const findForLogin = async (email) => {
  const [rows] = await pool.execute(`SELECT * FROM users WHERE email = ?`, [
    email,
  ]);

  if (rows.length === 0) return null;

  const user = rows[0];
  // Nếu database chưa có cột status, tạm thời gán mặc định là "ACTIVE" để không bị chặn đăng nhập
  if (!user.status) {
    user.status = "ACTIVE";
  }

  return user;
};

const createCustomer = async (data, hashedPassword) => {
  const [result] = await pool.execute(
    `
        INSERT INTO users (full_name, email, password_hash, phone, role_id)
        VALUES (?, ?, ?, ?, ?)`,
    [data.full_name, data.email, hashedPassword, data.phone, 2], // Giả sử role_id = 2 là customer
  );

  return getUserId(result.insertId);
};

const updateCustomer = async (id, full_name, email, hashedPassword, phone) => {
  await pool.execute(
    `UPDATE users
        SET
        full_name = ?,
        email = ?,
        password_hash = ?,
        phone = ?
        WHERE id = ?`,
    [full_name, email, hashedPassword, phone, id],
  );

  return getUserId(id);
};

module.exports = {
  getUserId,
  getUserByEmail,
  findForLogin, // Export thêm hàm này
  createCustomer,
  updateCustomer,
};
