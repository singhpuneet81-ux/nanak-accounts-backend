/**
 * Payment Success Email Controller
 * 
 * Called by the frontend PaymentSuccess page after Stripe redirects back.
 * Looks up the submission via the Stripe session ID, then sends:
 *   1. Payment receipt email to the customer (with PDF invoice attached)
 *   2. Admin notification email about the payment
 *
 * IMPORTANT: Update your Stripe success_url to include session_id:
 *   success_url: `${BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`
 *   (Stripe auto-replaces {CHECKOUT_SESSION_ID} with the real ID)
 */

const Submission = require("../models/Submission");
const { asyncHandler } = require("../middleware/asyncHandler");
const { getStripe } = require("../config/stripe");
const {
  sendPaymentSuccessEmailToUser,
  notifyAdminPaymentReceived,
} = require("../services/mailer");
const { generatePaymentReceipt } = require("../services/receiptGenerator");

const triggerPaymentSuccessEmail = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ success: false, message: "sessionId required" });
  }

  // 1. Retrieve Stripe session to confirm payment
  const stripe = getStripe();
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("❌ Stripe session retrieve failed:", err.message);
    return res.status(400).json({ success: false, message: "Invalid session ID" });
  }

  if (session.payment_status !== "paid") {
    return res.status(400).json({ success: false, message: "Payment not completed" });
  }

  // 2. Find submission by Stripe session ID
  const submission = await Submission.findOne({ stripeCheckoutSessionId: sessionId });
  if (!submission) {
    return res.status(404).json({ success: false, message: "Submission not found" });
  }

  // 3. Prevent duplicate emails
  if (submission.emailsSent) {
    return res.json({ success: true, message: "Emails already sent" });
  }

  // 4. Generate PDF receipt (matching the Nanak Accountants invoice format)
  let pdfBuffer;
  try {
    pdfBuffer = await generatePaymentReceipt(submission, {
      paymentIntentId: session.payment_intent,
      currency: "aud",
    });
  } catch (err) {
    console.error("❌ PDF generation failed:", err.message);
    // Continue without PDF rather than failing the whole flow
    pdfBuffer = null;
  }

  // 5. Send emails (best-effort, don't fail the response)
  const emailResults = { user: false, admin: false };

  try {
    await sendPaymentSuccessEmailToUser({
      ...submission.toObject(),
      paymentIntentId: session.payment_intent,
      pdfBuffer, // pass pre-generated buffer
    });
    emailResults.user = true;
    console.log("✅ User payment receipt email sent to:", submission.email);
  } catch (err) {
    console.error("❌ User email failed:", err.message);
  }

  try {
    await notifyAdminPaymentReceived({
      ...submission.toObject(),
      stripeCheckoutSessionId: sessionId,
    });
    emailResults.admin = true;
    console.log("✅ Admin payment notification sent");
  } catch (err) {
    console.error("❌ Admin email failed:", err.message);
  }

  // 6. Mark emails as sent to prevent duplicates
  submission.emailsSent = true;
  submission.paymentStatus = "paid";
  submission.activityLog.push({
    action: "payment_confirmed",
    description: `Payment confirmed. User email: ${emailResults.user ? "sent" : "failed"}. Admin email: ${emailResults.admin ? "sent" : "failed"}.`,
    doneBy: "System",
    timestamp: new Date(),
  });
  await submission.save();

  return res.json({
    success: true,
    message: "Payment confirmed and emails sent",
    emailResults,
  });
});

module.exports = { triggerPaymentSuccessEmail };
