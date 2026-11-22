const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "JSON không hợp lệ"
        });
    }
    if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            success: false,
            message: "Email hoặc số điện thoại đã tồn tại"
        });
    }
    console.error(err);
    return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống"
    });
};
module.exports = errorHandler;