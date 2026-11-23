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
  average_rating: Number(row.average_rating || 0),
  review_count: Number(row.review_count || 0),
  sold_count: Number(row.sold_count || 0),
  status: row.status || "ACTIVE",
});

const getAllProducts = async (_req, res, next) => {
  try {
    const rows = await productModel.getAll(_req.query);
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
    return res.json({ success: true, data: { ...toProduct(row), images: await productModel.getImages(row.book_id) } });
  } catch (error) {
    return next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { title, price, stock, category_id } = req.body;
    if (typeof title !== "string" || !title.trim() || title.trim().length > 255 || typeof req.body.author === "string" && req.body.author.length > 150 || !Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isSafeInteger(Number(stock)) || Number(stock) < 0 || !Number.isSafeInteger(Number(category_id)) || Number(category_id) < 1) {
      return res.status(400).json({ success: false, message: "Thông tin sách chưa hợp lệ." });
    }
    const result = await productModel.create(title.trim(), Number(price), Number(stock), String(req.body.image || "").trim(), String(req.body.description || "").trim(), Number(category_id), String(req.body.author || "").trim());
    return res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) { return next(error); }
};

const getManagementProducts = async (_req, res, next) => {
  try {
    const rows = await productModel.getAllForManagement();
    return res.json({ success: true, data: rows.map(toProduct) });
  } catch (error) { return next(error); }
};

const updateProduct = async (req, res, next) => {
  try {
    const { title, price, stock, category_id } = req.body;
    if (typeof title !== "string" || !title.trim() || title.trim().length > 255 || typeof req.body.author === "string" && req.body.author.length > 150 || !Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isSafeInteger(Number(stock)) || Number(stock) < 0 || !Number.isSafeInteger(Number(category_id)) || Number(category_id) < 1) {
      return res.status(400).json({ success: false, message: "Thông tin sách chưa hợp lệ." });
    }
    const result = await productModel.update(Number(req.params.id), title.trim(), Number(price), Number(stock), String(req.body.image || "").trim(), String(req.body.description || "").trim(), Number(category_id), String(req.body.author || "").trim());
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Không tìm thấy sách." });
    return res.json({ success: true, message: "Đã cập nhật sách." });
  } catch (error) { return next(error); }
};

const updateProductStatus = async (req, res, next) => {
  try {
    if (!["ACTIVE", "INACTIVE"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ." });
    const [result] = await productModel.setStatus(Number(req.params.id), req.body.status);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Không tìm thấy sách." });
    return res.json({ success: true, message: "Đã cập nhật trạng thái sách." });
  } catch (error) { return next(error); }
};

const getProductImages = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: "Mã sản phẩm không hợp lệ." });
    return res.json({ success: true, data: await productModel.getImages(id) });
  } catch (error) { return next(error); }
};

const updateProductImages = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const images = req.body.images;
    if (!Number.isSafeInteger(id) || id <= 0 || !Array.isArray(images) || images.length > 10 || images.some((url) => typeof url !== "string" || url.trim().length > 255 || !/^(https?:\/\/|\/)/i.test(url.trim()))) {
      return res.status(400).json({ success: false, message: "Danh sách ảnh không hợp lệ (tối đa 10 ảnh, dùng URL https hoặc đường dẫn nội bộ)." });
    }
    const data = await productModel.setImages(id, [...new Set(images.map((url) => url.trim()))]);
    return res.json({ success: true, data });
  } catch (error) { return next(error); }
};

module.exports = { getAllProducts, getProductById, getManagementProducts, createProduct, updateProduct, updateProductStatus, getProductImages, updateProductImages };
