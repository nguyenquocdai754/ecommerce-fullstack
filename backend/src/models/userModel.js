const pool = require('../config/database');

const getUserId = async (id) => {
    const [rows] = await pool.execute(
        `SELECT *
        FROM user u JOIN roles r
        WHERE u.id = ?
        `,
        [id]);
    return rows[0];
};

const getUserByEmail = async (email) => {
    const [rows] = await pool.execute(
        `SELECT * FROM users WHERE email = ?`, [email]
    );
    return rows;
};

const createCustomer = async (fullname, email, hashedpassword, phone, address, role) => {
    const [result] = await pool.execute(
        `
        INSERT INTO users (fullname, email, hashedpassword, phone, address, role)
        VALUES (?, ?, ?, ?)  `,
        [fullname, email, hashedpassword, phone, address, role]
    );

    return result;
};

const updateCustomer = async (id, fullname, email, hashedPassword, phone, address) => {
    await pool.execute(
        `UPDATE users
        SET
        fullname = ?,
        email = ?,
        password = ?,
        phone = ?,
        address = ?
        WHERE id = ?`,
        [fullname, email, hashedPassword, phone, address, id]
    );

    return getUserId(id);
};

module.exports = {
    getUserId,
    getUserByEmail,
    createCustomer,
    updateCustomer
};