const db = require('../config/database');

const getAll = async () => {
    const [rows] = await db.query(
        `SELECT b.*, c.category_name
        FROM books b LEFT JOIN category c ON b.category_id = c.category_id
        ORDER BY b.book_id ASC`
    );
    return rows;
};

const create = async (title, price, stock, image, description, category_id, author) => {
    const [result] = await db.query(
        `INSERT INTO books (title, price, stock, image, description, category_id, author)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, price, stock, image, description, category_id, author]
    );
    return result;
};

const update = async (book_id, title, price, stock, image, description, category_id, author) => {
    const [result] = await db.query(
        `
        UPDATE books
        SET title = ?, price = ?, stock = ?, image = ?, description = ?, category_id = ?, author = ?
        WHERE book_id = ?
        `,
        [title, price, stock, image, description, category_id, author, book_id]
    );
    return result;
};

const remove = async book_id => {
    const [result] = await db.query(
        `
        DELETE FROM books
        WHERE book_id = ?
        `,
        [book_id]
    );
    return result;
};



module.exports = {
    getAll,
    create,
    update,
    remove
};