const reviews = require("../models/reviewModel");

const list = async (req, res, next) => {
  try {
    const data = await reviews.getForBook(Number(req.params.id));
    const count = data.length;
    const average = count ? data.reduce((sum, item) => sum + Number(item.rating), 0) / count : 0;
    return res.json({ success: true, data, summary: { count, average: Number(average.toFixed(1)) } });
  } catch (error) {
    return next(error);
  }
};

const mine = async (req, res, next) => {
  try {
    const bookId = Number(req.query.bookId);
    if (!Number.isSafeInteger(bookId) || bookId <= 0) return res.status(400).json({ success: false, message: "Mã sách không hợp lệ." });
    return res.json({ success: true, data: await reviews.getMine(req.user.id, bookId) });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment || comment.length > 3000) {
      return res.status(400).json({ success: false, message: "Đánh giá cần có từ 1 đến 5 sao và nội dung tối đa 3000 ký tự." });
    }
    const bookId = Number(req.params.id);
    if (!await reviews.canReview(req.user.id, bookId)) {
      return res.status(403).json({ success: false, message: "Bạn chỉ có thể đánh giá sách trong đơn hàng đã giao." });
    }
    await reviews.create(req.user.id, bookId, rating, String(req.body.title || "").trim().slice(0, 160), comment);
    return res.status(201).json({ success: true, message: "Cảm ơn bạn đã đánh giá sản phẩm." });
  } catch (error) {
    return next(error);
  }
};

const managementList = async (_req, res, next) => {
  try { return res.json({ success: true, data: await reviews.getAllForManagement() }); }
  catch (error) { return next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    if (!["VISIBLE", "HIDDEN"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Trạng thái đánh giá không hợp lệ." });
    const [result] = await reviews.setStatus(Number(req.params.id), req.body.status);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá." });
    return res.json({ success: true });
  } catch (error) { return next(error); }
};

const deleteForManagement = async (req, res, next) => {
  try {
    const [result] = await reviews.deleteForManagement(Number(req.params.id));
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá." });
    return res.json({ success: true, message: "Đã xóa đánh giá vi phạm." });
  } catch (error) { return next(error); }
};

const updateMine = async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment || comment.length > 3000) return res.status(400).json({ success: false, message: "Đánh giá chưa hợp lệ." });
    const [result] = await reviews.updateMine(req.user.id, Number(req.params.id), rating, String(req.body.title || "").trim().slice(0, 160), comment);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá của bạn." });
    return res.json({ success: true });
  } catch (error) { return next(error); }
};

const deleteMine = async (req, res, next) => {
  try {
    const [result] = await reviews.deleteMine(req.user.id, Number(req.params.id));
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá của bạn." });
    return res.json({ success: true });
  } catch (error) { return next(error); }
};

module.exports = { list, mine, create, managementList, updateStatus, deleteForManagement, updateMine, deleteMine };
