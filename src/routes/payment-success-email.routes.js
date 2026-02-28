/**
 * Payment Success Email Routes
 * Mounts under: app.use("/api/checkout", paymentSuccessEmailRoutes)
 */
const express = require("express");
const router = express.Router();
const { triggerPaymentSuccessEmail } = require("../controllers/payment-success-email.controller");

// POST /api/checkout/payment-success-email
router.post("/payment-success-email", triggerPaymentSuccessEmail);

module.exports = router;
