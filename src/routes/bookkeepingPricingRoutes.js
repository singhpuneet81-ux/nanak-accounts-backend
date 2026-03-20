
const router = require("express").Router();
const { protect } = require("../middleware/auth");
const bookkeepingController = require("../controllers/bookkeepingPricing.controller");
const { seed: bookkeepingSeed } = require("../seeds/bookkeepingPricing.seed");

router.get("/", protect, bookkeepingController.getAll);
router.put("/", protect, bookkeepingController.upsert);
router.delete("/", protect, bookkeepingController.remove);
router.post("/seed", protect, bookkeepingSeed);

module.exports = router;