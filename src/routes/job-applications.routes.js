/**
 * Job Applications Routes
 *
 * Public routes (no auth):
 *   POST   /api/job-applications              → Submit specific application (multipart)
 *   POST   /api/job-applications/general       → Submit general application (multipart)
 *
 * Admin routes (JWT + admin role required):
 *   GET    /api/job-applications/admin         → List all applications (paginated, filtered)
 *   GET    /api/job-applications/admin/stats   → Dashboard statistics
 *   GET    /api/job-applications/admin/:id     → Single application detail
 *   PATCH  /api/job-applications/admin/:id/status → Update application status
 *   PATCH  /api/job-applications/admin/:id/notes  → Add review notes
 *   DELETE /api/job-applications/admin/:id     → Delete application
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/job-applications.controller");

// ── Public ──
router.post("/", controller.upload, controller.submit);
router.post("/general", controller.upload, controller.submitGeneral);

// ── Admin (uncomment auth middleware when ready) ──
// router.use("/admin", authMiddleware, requireRole("admin"));
router.get("/admin", controller.getAll);
router.get("/admin/stats", controller.getStats);
router.get("/admin/:id", controller.getById);
router.patch("/admin/:id/status", controller.updateStatus);
router.patch("/admin/:id/notes", controller.addNote);
router.delete("/admin/:id", controller.delete);

module.exports = router;

/**
 * Mount in your Express app:
 *   const jobAppRoutes = require("./routes/job-applications.routes");
 *   app.use("/api/job-applications", jobAppRoutes);
 */