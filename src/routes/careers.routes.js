/**
 * Careers Routes — Job Openings
 *
 * Public routes (no auth):
 *   GET    /api/careers/openings            → List active openings (with filters)
 *   GET    /api/careers/openings/:id        → Single opening detail
 *
 * Admin routes (JWT + admin role required):
 *   GET    /api/careers/admin/openings      → All openings (including inactive)
 *   POST   /api/careers/admin/openings      → Create new opening
 *   PUT    /api/careers/admin/openings/:id  → Update opening
 *   DELETE /api/careers/admin/openings/:id  → Delete opening
 *   PATCH  /api/careers/admin/openings/:id/toggle → Toggle active status
 *   POST   /api/careers/admin/openings/seed → Seed default openings
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/careers.controller");

// ── Public ──
router.get("/openings", controller.getAll);
router.get("/openings/:id", controller.getById);

// ── Admin (uncomment auth middleware when ready) ──
// router.use("/admin", authMiddleware, requireRole("admin"));
router.get("/admin/openings", controller.adminGetAll);
router.post("/admin/openings", controller.create);
router.put("/admin/openings/:id", controller.update);
router.delete("/admin/openings/:id", controller.delete);
router.patch("/admin/openings/:id/toggle", controller.toggleActive);
router.post("/admin/openings/seed", controller.seed);

module.exports = router;

/**
 * Mount in your Express app:
 *   const careersRoutes = require("./routes/careers.routes");
 *   app.use("/api/careers", careersRoutes);
 */