const router = require("express").Router();
const auth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const controller = require("../controllers/adminUserController");

router.use(auth, authorize("ADMIN"));
router.get("/users", controller.list);
router.post("/users/managers", controller.createManager);
router.patch("/users/:id/status", controller.updateStatus);
router.patch("/users/:id/role", controller.updateRole);

module.exports = router;
