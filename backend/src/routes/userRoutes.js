const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const controller = require("../controllers/userController");
router.use(requireAuth);
router.get("/me", controller.getMe);
router.put("/me", controller.updateMe);
router.put("/me/password", controller.changePassword);
router.get("/me/addresses", controller.getAddresses);
router.post("/me/addresses", controller.addAddress);
router.put("/me/addresses/:id", controller.updateAddress);
router.delete("/me/addresses/:id", controller.deleteAddress);
router.get("/role-check", authorize("MANAGER", "ADMIN"), (req, res) => {
    res.json({ success: true, data: { role: req.user.role } });
});
module.exports = router;
