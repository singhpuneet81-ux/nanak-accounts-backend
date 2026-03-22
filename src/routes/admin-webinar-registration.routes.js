/**
 * Admin Webinar Registration Routes
 *
 * GET    /api/admin/webinar-registrations       → List all registrations
 * PUT    /api/admin/webinar-registrations/:id   → Update registration status
 * DELETE /api/admin/webinar-registrations/:id   → Delete registration
 */

const express = require("express");
const router = express.Router();
const adminRegController = require("../controllers/admin-webinar-registration.controller");

router.get("/", adminRegController.getAll);
router.put("/:id", adminRegController.updateStatus);
router.delete("/:id", adminRegController.delete);

module.exports = router;