const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền thực hiện chức năng này.",
    });
  }
  return next();
};

module.exports = authorize;
