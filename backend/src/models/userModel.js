const pool = require("../config/database");

const getUserId = async (id) => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar, u.status,
            r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
    [id],
  );
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
  const [rows] = await pool.execute(
    `SELECT u.*, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.email = ? LIMIT 1`,
    [email],
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar, u.status,
            r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
};

const createCustomer = async (data, hashedPassword) => {
  const [result] = await pool.execute(
    `
        INSERT INTO users (full_name, email, password_hash, phone, role_id)
        VALUES (?, ?, ?, ?, (SELECT id FROM roles WHERE name = 'CUSTOMER'))`,
    [data.full_name, data.email, hashedPassword, data.phone],
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

const getAllForAdmin = async () => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id ORDER BY u.created_at DESC`,
  );
  return rows;
};

const setStatus = async (id, status) => pool.execute("UPDATE users SET status = ? WHERE id = ?", [status, id]);

const setRole = async (id, role) => pool.execute(
  "UPDATE users SET role_id = (SELECT id FROM roles WHERE name = ?) WHERE id = ?",
  [role, id],
);

const createManager = async ({ full_name, email, phone }, passwordHash) => {
  const [result] = await pool.execute(
    `INSERT INTO users (role_id, full_name, email, phone, password_hash)
     VALUES ((SELECT id FROM roles WHERE name = 'MANAGER'), ?, ?, ?, ?)`,
    [full_name, email, phone, passwordHash],
  );
  return getUserId(result.insertId);
};

const updateProfile = async (id, fullName, phone, avatar) => pool.execute(
  "UPDATE users SET full_name = ?, phone = ?, avatar = ? WHERE id = ?",
  [fullName, phone || null, avatar || null, id],
);

const changePassword = async (id, passwordHash) => pool.execute(
  "UPDATE users SET password_hash = ? WHERE id = ?",
  [passwordHash, id],
);

const getPasswordHash = async (id) => {
  const [rows] = await pool.execute("SELECT password_hash FROM users WHERE id = ?", [id]);
  return rows[0]?.password_hash || null;
};

const listAddresses = async (userId) => {
  const [rows] = await pool.execute(
    "SELECT id, recipient_name, phone, address, note, is_default FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC",
    [userId],
  );
  return rows;
};

const createAddress = async (userId, data) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("SELECT id FROM users WHERE id = ? FOR UPDATE", [userId]);
    const [[{ addressCount }]] = await connection.execute(
      "SELECT COUNT(*) AS addressCount FROM addresses WHERE user_id = ?",
      [userId],
    );
    const isDefault = Boolean(data.is_default) || addressCount === 0;
    if (isDefault) await connection.execute("UPDATE addresses SET is_default = FALSE WHERE user_id = ?", [userId]);
    const [result] = await connection.execute(
      "INSERT INTO addresses (user_id, recipient_name, phone, address, note, is_default) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, data.recipient_name, data.phone, data.address, data.note || null, isDefault],
    );
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
};

const updateAddress = async (userId, id, data) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("SELECT id FROM users WHERE id = ? FOR UPDATE", [userId]);
    const [owned] = await connection.execute("SELECT id FROM addresses WHERE id = ? AND user_id = ? FOR UPDATE", [id, userId]);
    if (!owned.length) { await connection.rollback(); return [{ affectedRows: 0 }]; }
    if (data.is_default) await connection.execute("UPDATE addresses SET is_default = FALSE WHERE user_id = ?", [userId]);
    const [result] = await connection.execute(
      `UPDATE addresses SET recipient_name = ?, phone = ?, address = ?, note = ?, is_default = ?
       WHERE id = ? AND user_id = ?`,
      [data.recipient_name, data.phone, data.address, data.note || null, Boolean(data.is_default), id, userId],
    );
    await connection.commit();
    return [result];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
};

const deleteAddress = async (userId, id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("SELECT id FROM users WHERE id = ? FOR UPDATE", [userId]);
    const [owned] = await connection.execute("SELECT is_default FROM addresses WHERE id = ? AND user_id = ? FOR UPDATE", [id, userId]);
    if (!owned.length) { await connection.rollback(); return [{ affectedRows: 0 }]; }
    const [result] = await connection.execute("DELETE FROM addresses WHERE id = ? AND user_id = ?", [id, userId]);
    if (owned[0].is_default) {
      await connection.execute("UPDATE addresses SET is_default = TRUE WHERE user_id = ? ORDER BY id DESC LIMIT 1", [userId]);
    }
    await connection.commit();
    return [result];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
};

module.exports = {
  getUserId,
  getUserByEmail,
  findForLogin,
  findById,
  createCustomer,
  updateCustomer,
  getAllForAdmin,
  setStatus,
  setRole,
  createManager,
  updateProfile,
  changePassword,
  getPasswordHash,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
