/**
 * Webinar Routes — Public
 *
 * GET  /api/webinars              → List published webinars
 * GET  /api/webinars/:id          → Get single webinar
 * POST /api/webinars/:id/register → Register for a webinar
 */

const express = require("express");
const router = express.Router();
const webinarController = require("../controllers/webinar.controller");

router.get("/", webinarController.getAll);
router.get("/:id", webinarController.getById);
router.post("/:id/register", webinarController.register);

module.exports = router;