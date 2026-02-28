/**
 * Accounting Pricing Routes
 * 
 * Public routes (no auth):
 *   GET  /api/admin/accounting-pricing          → Get all 4 services
 *   GET  /api/admin/accounting-pricing/:key      → Get single service
 * 
 * Admin routes (JWT + admin role required):
 *   PUT  /api/admin/accounting-pricing/:key       → Update full config
 *   PUT  /api/admin/accounting-pricing/:key/tiers → Update tier pricing only
 *   PUT  /api/admin/accounting-pricing/:key/addons → Update addon pricing only
 *   POST /api/admin/accounting-pricing/seed       → Seed all from JSON
 *   DELETE /api/admin/accounting-pricing/:key     → Reset to defaults
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/accounting-pricing.controller");

// Middleware (import from your auth middleware)
// const { requireAuth, requireAdmin } = require("../middleware/auth");

// ─── Public Routes ──────────────────────────────────────────────
router.get("/", controller.getAll);
router.get("/:serviceKey", controller.getByServiceKey);







// ─── Admin Routes ───────────────────────────────────────────────
// Uncomment auth middleware when ready:
// router.use(requireAuth, requireAdmin);

router.put("/:serviceKey", controller.update);
router.put("/:serviceKey/tiers", controller.updateTiers);
router.put("/:serviceKey/addons", controller.updateAddons);
router.post("/seed", controller.seed);
router.delete("/:serviceKey", controller.reset);

module.exports = router;

/**
 * Mount in your Express app:
 * 
 *   const accountingPricingRoutes = require("./routes/accounting-pricing.routes");
 *   app.use("/api/admin/accounting-pricing", accountingPricingRoutes);
 */
