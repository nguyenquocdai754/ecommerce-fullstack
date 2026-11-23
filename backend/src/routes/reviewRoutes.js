const router = require("express").Router();
const auth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const controller = require("../controllers/reviewController");

router.use(auth, authorize("CUSTOMER"));
router.get("/mine", controller.mine);
router.put("/:id", controller.updateMine);
router.delete("/:id", controller.deleteMine);

module.exports = router;
