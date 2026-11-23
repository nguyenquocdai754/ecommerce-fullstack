const bcrypt = require("bcrypt");
const users = require("../models/userModel");
const validation = require("../utils/authValidation");

const getMe = async (req, res) => res.json({ success: true, data: req.user });

const updateMe = async (req, res, next) => {
  try {
  const body = { full_name: req.body.full_name, phone: typeof req.body.phone === "string" && req.body.phone.trim() ? req.body.phone : null, avatar: req.body.avatar ?? null };
    if (!validation.validProfile(body)) return res.status(400).json({ success: false, message: "Thông tin cá nhân chưa hợp lệ." });
    await users.updateProfile(req.user.id, body.full_name.trim(), body.phone?.trim() || null, body.avatar?.trim() || null);
    return res.json({ success: true, data: await users.findById(req.user.id) });
  } catch (error) { return next(error); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 8 || Buffer.byteLength(newPassword, "utf8") > 72) {
      return res.status(400).json({ success: false, message: "Mật khẩu mới cần có ít nhất 8 ký tự." });
    }
    const oldHash = await users.getPasswordHash(req.user.id);
    if (!oldHash || !await bcrypt.compare(currentPassword, oldHash)) return res.status(401).json({ success: false, message: "Mật khẩu hiện tại không đúng." });
    await users.changePassword(req.user.id, await bcrypt.hash(newPassword, 12));
    return res.json({ success: true, message: "Đã cập nhật mật khẩu." });
  } catch (error) { return next(error); }
};

const getAddresses = async (req, res, next) => {
  try { return res.json({ success: true, data: await users.listAddresses(req.user.id) }); }
  catch (error) { return next(error); }
};

const addAddress = async (req, res, next) => {
  try {
    const { recipient_name, phone, address } = req.body;
    const validPhone = typeof phone === "string" && /^\+?[0-9]{10,15}$/.test(phone.trim());
    if (typeof recipient_name !== "string" || !recipient_name.trim() || !validPhone || typeof address !== "string" || !address.trim()) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập tên, số điện thoại và địa chỉ hợp lệ." });
    }
    const id = await users.createAddress(req.user.id, { ...req.body, recipient_name: recipient_name.trim(), phone: phone.trim(), address: address.trim() });
    return res.status(201).json({ success: true, data: { id } });
  } catch (error) { return next(error); }
};

const updateAddress = async (req, res, next) => {
  try {
    const { recipient_name, phone, address } = req.body;
    if (typeof recipient_name !== "string" || !recipient_name.trim() || typeof phone !== "string" || !/^\+?[0-9]{10,15}$/.test(phone.trim()) || typeof address !== "string" || !address.trim()) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập tên, số điện thoại và địa chỉ hợp lệ." });
    }
    const [result] = await users.updateAddress(req.user.id, Number(req.params.id), { ...req.body, recipient_name: recipient_name.trim(), phone: phone.trim(), address: address.trim() });
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ." });
    return res.json({ success: true });
  } catch (error) { return next(error); }
};

const deleteAddress = async (req, res, next) => {
  try {
    const [result] = await users.deleteAddress(req.user.id, Number(req.params.id));
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ." });
    return res.json({ success: true });
  } catch (error) { return next(error); }
};

module.exports = { getMe, updateMe, changePassword, getAddresses, addAddress, updateAddress, deleteAddress };
