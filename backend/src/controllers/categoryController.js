const categoryModel = require("../models/categoryModel");

const getAllCategories = async (_req, res, next) => {
  try {
    const data = await categoryModel.getAll();
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAllCategories };
