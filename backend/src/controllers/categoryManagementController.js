const model = require("../models/categoryModel");

const list = async (_req, res, next) => {
  try { return res.json({ success: true, data: await model.getAllForManagement() }); }
  catch (error) { return next(error); }
};
const create = async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name || name.length > 100) return res.status(400).json({ success: false, message: "Tên danh mục không hợp lệ." });
    return res.status(201).json({ success: true, data: { id: await model.create(name, req.body.description) } });
  } catch (error) { return next(error); }
};
const update = async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name || name.length > 100) return res.status(400).json({ success: false, message: "Tên danh mục không hợp lệ." });
    const [result] = await model.update(Number(req.params.id), name, req.body.description);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Không tìm thấy danh mục." });
    return res.json({ success: true });
  } catch (error) { return next(error); }
};
const status = async (req, res, next) => {
  try {
    if (!["ACTIVE", "INACTIVE"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ." });
    const [result] = await model.setStatus(Number(req.params.id), req.body.status);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Không tìm thấy danh mục." });
    return res.json({ success: true });
  } catch (error) { return next(error); }
};

module.exports = { list, create, update, status };
