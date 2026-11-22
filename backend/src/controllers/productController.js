const productModel = require("../models/productModel");

const toProduct = (row) => ({
  id: row.book_id,
  name: row.title,
  author: row.author || "",
  sale_price: Number(row.price),
  original_price: Number(row.price),
  stock_quantity: Number(row.stock || 0),
  thumbnail: row.image || "",
  short_description: row.description || "",
  category_id: row.category_id,
  category_name: row.category_name || "",
});

const getAllProducts = async (_req, res, next) => {
  try {
    const rows = await productModel.getAll();
    return res.json({ success: true, data: rows.map(toProduct) });
  } catch (error) {
    return next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const row = await productModel.getById(req.params.id);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sách",
      });
    }
    return res.json({ success: true, data: toProduct(row) });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAllProducts, getProductById };
