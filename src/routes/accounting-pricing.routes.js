
// const express = require("express");
// const router = express.Router();
// const controller = require("../controllers/accounting-pricing.controller");

// // ─── Public Routes ──────────────────────────────────────────────
// router.get("/", controller.getAll);
// router.get("/:serviceKey", controller.getByServiceKey);


// router.put("/:serviceKey", controller.update);
// router.put("/:serviceKey/tiers", controller.updateTiers);
// router.put("/:serviceKey/addons", controller.updateAddons);
// router.post("/seed", controller.seed);
// router.delete("/:serviceKey", controller.reset);

// module.exports = router;

const express = require("express");
const router = express.Router();
const controller = require("../controllers/accounting-pricing.controller");
const { protect, isAdmin } = require("../middleware/auth");

// Public
router.get("/", controller.getAll);
router.get("/:serviceKey", controller.getByServiceKey);

// Admin (protected)
router.put("/:serviceKey", protect, isAdmin, controller.update);
router.put("/:serviceKey/tiers", protect, isAdmin, controller.updateTiers);
router.put("/:serviceKey/addons", protect, isAdmin, controller.updateAddons);
router.post("/seed", protect, isAdmin, controller.seed);
router.delete("/:serviceKey", protect, isAdmin, controller.reset);

module.exports = router;
