    /**
 * Sole Trader Pricing Routes
 * 
 * Public routes (no auth):
 *   GET  /api/admin/sole-trader-pricing             → Get config
 * 
 * Admin routes (JWT + admin role required):
 *   PUT  /api/admin/sole-trader-pricing             → Update full config
 *   PUT  /api/admin/sole-trader-pricing/streams     → Update income streams only
 *   PUT  /api/admin/sole-trader-pricing/plans       → Update plan features only
 *   POST /api/admin/sole-trader-pricing/seed        → Seed from JSON
 *   DELETE /api/admin/sole-trader-pricing           → Reset to defaults
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/sole-trader-pricing.controller");

// Public
router.get("/", controller.get);

// Admin (uncomment auth middleware when ready)
router.put("/", controller.update);
router.put("/streams", controller.updateStreams);
router.put("/plans", controller.updatePlans);
router.post("/seed", controller.seed);
router.delete("/", controller.reset);

module.exports = router;

/**
 * Mount in your Express app:
 *   const soleTraderPricingRoutes = require("./routes/sole-trader-pricing.routes");
 *   app.use("/api/admin/sole-trader-pricing", soleTraderPricingRoutes);
 */
