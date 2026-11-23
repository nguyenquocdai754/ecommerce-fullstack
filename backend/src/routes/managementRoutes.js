const router = require("express").Router();
const auth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const orders = require("../controllers/orderController");
const products = require("../controllers/productController");
const categories = require("../controllers/categoryManagementController");
const dashboard = require("../controllers/dashboardController");
const reviews = require("../controllers/reviewController");

router.use(auth, authorize("MANAGER", "ADMIN"));
router.get("/dashboard", dashboard.getSummary);
router.get("/orders", orders.managementList);
router.get("/orders/:id", orders.detail);
router.patch("/orders/:id/status", orders.updateStatus);
router.get("/books", products.getManagementProducts);
router.post("/books", products.createProduct);
router.put("/books/:id", products.updateProduct);
router.patch("/books/:id/status", products.updateProductStatus);
router.get("/books/:id/images", products.getProductImages);
router.put("/books/:id/images", products.updateProductImages);
router.get("/categories", categories.list);
router.post("/categories", categories.create);
router.put("/categories/:id", categories.update);
router.patch("/categories/:id/status", categories.status);
router.get("/reviews", reviews.managementList);
router.patch("/reviews/:id/status", reviews.updateStatus);
router.delete("/reviews/:id", reviews.deleteForManagement);

module.exports = router;
