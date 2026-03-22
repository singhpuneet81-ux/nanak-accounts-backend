/**
 * Admin Webinar Routes
 *
 * GET    /api/admin/webinars                          → List all webinars
 * GET    /api/admin/webinars/:id                      → Get single webinar
 * POST   /api/admin/webinars                          → Create webinar (multipart)
 * PUT    /api/admin/webinars/:id                      → Update webinar (multipart)
 * DELETE /api/admin/webinars/:id                      → Delete webinar
 * PATCH  /api/admin/webinars/:id/status               → Toggle webinar status
 * GET    /api/admin/webinars/:id/registrations         → Get registrations for webinar
 * GET    /api/admin/webinars/:id/registrations/export  → Export CSV
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const adminWebinarController = require("../controllers/admin-webinar.controller");
const adminRegController = require("../controllers/admin-webinar-registration.controller");

// ── Multer config for webinar images ──

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/webinars/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WEBP images are allowed"), false);
    }
  },
});

const uploadFields = upload.fields([
  { name: "speakerImage", maxCount: 1 },
  { name: "thumbnailImage", maxCount: 1 },
]);

// ── Webinar CRUD routes ──

router.get("/", adminWebinarController.getAll);
router.get("/:id", adminWebinarController.getById);
router.post("/", uploadFields, adminWebinarController.create);
router.put("/:id", uploadFields, adminWebinarController.update);
router.delete("/:id", adminWebinarController.delete);
router.patch("/:id/status", adminWebinarController.toggleStatus);

// ── Registration routes (nested under webinar) ──

router.get("/:id/registrations", adminRegController.getAllForWebinar);
router.get("/:id/registrations/export", adminRegController.exportCSV);

module.exports = router;