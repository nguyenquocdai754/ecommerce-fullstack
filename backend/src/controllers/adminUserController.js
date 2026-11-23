const bcrypt = require("bcrypt");
const users = require("../models/userModel");
const validation = require("../utils/authValidation");

const list = async (_req, res, next) => {
  try { return res.json({ success: true, data: await users.getAllForAdmin() }); }
  catch (error) { return next(error); }
};

const createManager = async (req, res, next) => {
  try {
    const { full_name, email, phone, password } = req.body;
    if (!validation.validRegister({ full_name, email, phone, password })) {
      return res.status(400).json({ success: false, message: "Thông tin tài khoản quản lý chưa hợp lệ." });
    }
    const data = await users.createManager({ full_name: full_name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() }, await bcrypt.hash(password, 12));
    return res.status(201).json({ success: true, data });
  } catch (error) { return next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    if (!["ACTIVE", "LOCKED"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Trạng thái tài khoản không hợp lệ." });
    if (Number(req.params.id) === req.user.id) return res.status(409).json({ success: false, message: "Không thể tự khóa tài khoản đang sử dụng." });
    const [result] = await users.setStatus(Number(req.params.id), req.body.status);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản." });
    return res.json({ success: true });
  } catch (error) { return next(error); }
};

const updateRole = async (req, res, next) => {
  try {
    if (!["CUSTOMER", "MANAGER", "ADMIN"].includes(req.body.role)) return res.status(400).json({ success: false, message: "Vai trò không hợp lệ." });
    if (Number(req.params.id) === req.user.id) return res.status(409).json({ success: false, message: "Không thể tự thay đổi vai trò của mình." });
    const [result] = await users.setRole(Number(req.params.id), req.body.role);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản." });
    return res.json({ success: true });
  } catch (error) { return next(error); }
};

module.exports = { list, createManager, updateStatus, updateRole };
