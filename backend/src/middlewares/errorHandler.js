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
            message: String(err.sql || "").includes("reviews")
                ? "Bạn đã đánh giá sản phẩm này. Hãy chỉnh sửa đánh giá hiện có."
                : "Email hoặc số điện thoại đã tồn tại"
        });
    }
    if (err.status && err.status >= 400 && err.status < 500) {
        return res.status(err.status).json({ success: false, message: err.message });
    }
    console.error(err);
    return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống"
    });
};
module.exports = errorHandler;
