const service = require("../services/orderService");

const wrap = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res);
  } catch (error) {
    return next(error);
  }
};

const create = wrap(async (req, res) => {
  const data = await service.createOrder(req.user.id, req.body);
  return res.status(201).json({ success: true, data });
});
const mine = wrap(async (req, res) =>
  res.json({ success: true, data: await service.getMine(req.user.id) }),
);
const detail = wrap(async (req, res) => {
  const data = await service.getById(Number(req.params.id), req.user);
  if (!data) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
  return res.json({ success: true, data });
});
const cancel = wrap(async (req, res) => {
  await service.cancelOrder(Number(req.params.id), req.user.id, req.body.reason);
  return res.json({ success: true, message: "Đã hủy đơn hàng." });
});
const confirmReceived = wrap(async (req, res) => {
  await service.confirmReceived(Number(req.params.id), req.user.id);
  return res.json({ success: true, message: "Đã xác nhận nhận hàng." });
});
const managementList = wrap(async (_req, res) =>
  res.json({ success: true, data: await service.getManagementOrders() }),
);
const updateStatus = wrap(async (req, res) => {
  await service.updateStatus(Number(req.params.id), req.body.status);
  return res.json({ success: true, message: "Đã cập nhật trạng thái đơn hàng." });
});

module.exports = { create, mine, detail, cancel, confirmReceived, managementList, updateStatus };
