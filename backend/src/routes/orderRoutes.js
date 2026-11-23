const router = require("express").Router();
const auth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const controller = require("../controllers/orderController");

router.use(auth);
router.post("/", authorize("CUSTOMER"), controller.create);
router.get("/my-orders", authorize("CUSTOMER"), controller.mine);
router.get("/management", authorize("MANAGER", "ADMIN"), controller.managementList);
router.patch("/:id/status", authorize("MANAGER", "ADMIN"), controller.updateStatus);
router.patch("/:id/cancel", authorize("CUSTOMER"), controller.cancel);
router.patch("/:id/received", authorize("CUSTOMER"), controller.confirmReceived);
router.get("/:id", controller.detail);

module.exports = router;
