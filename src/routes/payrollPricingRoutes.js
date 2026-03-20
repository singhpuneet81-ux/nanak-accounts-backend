
const router = require("express").Router();
const { protect } = require("../middleware/auth");
const payrollController = require("../controllers/payrollPricing.controller");
const { seed: payrollSeed } = require("../seeds/payrollPricing.seed");

router.get("/", protect, payrollController.getAll);
router.put("/", protect, payrollController.upsert);
router.delete("/", protect, payrollController.remove);
router.post("/seed", protect, payrollSeed);

module.exports = router;

