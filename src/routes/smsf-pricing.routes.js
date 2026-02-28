/**
 * SMSF Pricing Routes
 * 
 * Public routes (no auth):
 *   GET  /api/admin/smsf-pricing              → Get SMSF pricing config
 * 
 * Admin routes (JWT + admin role required):
 *   PUT  /api/admin/smsf-pricing              → Update full config
 *   PUT  /api/admin/smsf-pricing/property-rates → Update property rates only
 *   PUT  /api/admin/smsf-pricing/investment-addons → Update investment addons only
 *   POST /api/admin/smsf-pricing/seed         → Seed from JSON
 *   DELETE /api/admin/smsf-pricing            → Reset to defaults
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/smsf-pricing.controller");

// Public
router.get("/", controller.get);

// Admin (uncomment auth middleware when ready)
router.put("/", controller.update);
router.put("/property-rates", controller.updatePropertyRates);
router.put("/investment-addons", controller.updateInvestmentAddons);
router.post("/seed", controller.seed);
router.delete("/", controller.reset);

module.exports = router;

/**
 * Mount in your Express app:
 *   const smsfPricingRoutes = require("./routes/smsf-pricing.routes");
 *   app.use("/api/admin/smsf-pricing", smsfPricingRoutes);
 */
