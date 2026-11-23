const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const reviewController = require("../controllers/reviewController");
const requireAuth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");

router.get("/", productController.getAllProducts);
router.get("/:id/reviews", reviewController.list);
router.post("/:id/reviews", requireAuth, authorize("CUSTOMER"), reviewController.create);
router.get("/:id", productController.getProductById);

module.exports = router;
