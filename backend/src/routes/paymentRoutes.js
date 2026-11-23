const router = require("express").Router();
const auth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const controller = require("../controllers/paymentController");

router.post("/:orderId/demo-result", auth, authorize("CUSTOMER"), controller.simulatedResult);

module.exports = router;
