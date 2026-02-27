const Submission = require("../models/Submission");
const ActivityLog = require("../models/ActivityLog");
const { asyncHandler } = require("../middleware/asyncHandler");
const { getStripe } = require("../config/stripe");
const {
  sendPaymentSuccessEmailToUser,
  notifyAdminPaymentReceived,
} = require("../services/emailService");

async function addActivity(submission, activity) {
  submission.activityLog.push({
    action: activity.action,
    description: activity.description,
    doneBy: activity.doneBy,
    timestamp: activity.timestamp || new Date(),
  });
  await submission.save();
  await ActivityLog.create({
    submissionId: submission._id,
    action: activity.action,
    description: activity.description,
    doneBy: activity.doneBy,
    details: activity.details || {},
    timestamp: activity.timestamp || new Date(),
  }).catch(() => {});
}

const stripeWebhook = asyncHandler(async (req, res) => {
  console.log("🔥 Stripe webhook HIT");
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret)
    return res
      .status(500)
      .json({ success: false, message: "STRIPE_WEBHOOK_SECRET missing" });

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    err.type = "StripeSignatureVerificationError";
    throw err;
  }

  try {
    switch (event.type) {
     case "checkout.session.completed": {
  console.log("✅ checkout.session.completed triggered");

  const session = event.data.object;
  console.log("Session ID:", session.id);
  console.log("Metadata:", session.metadata);

  const submissionId = session.metadata?.submission_id;
  console.log("Submission ID from metadata:", submissionId);

  if (!submissionId) {
    console.log("❌ No submissionId in metadata");
    break;
  }

  const submission = await Submission.findById(submissionId);
  console.log("Submission found:", !!submission);

  if (!submission) {
    console.log("❌ Submission not found in DB");
    break;
  }

  console.log("Current paymentStatus:", submission.paymentStatus);

  if (submission.paymentStatus === "paid") {
    console.log("⚠ Already paid — skipping");
    break;
  }

  console.log("💰 Marking as paid");

  submission.paymentStatus = "paid";
  submission.paymentIntentId =
    session.payment_intent || submission.paymentIntentId;
  submission.stripeCheckoutSessionId =
    session.id || submission.stripeCheckoutSessionId;
  submission.paymentCompletedAt = new Date();

  await submission.save();

  console.log("📧 Sending user payment success email...");

  try {
    await sendPaymentSuccessEmailToUser(submission);
    console.log("✅ User payment email sent");
  } catch (e) {
    console.error("❌ User payment email failed:", e);
  }

  console.log("📧 Sending admin payment email...");

  try {
    await notifyAdminPaymentReceived(submission);
    console.log("✅ Admin payment email sent");
  } catch (e) {
    console.error("❌ Admin payment email failed:", e);
  }

  break;
}

      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const submission = await Submission.findOne({ paymentIntentId: pi.id });
        if (submission) {
          submission.paymentStatus = "paid";
          await addActivity(submission, {
            action: "payment",
            description: `Payment received — $${(pi.amount_received || 0) / 100}`,
            doneBy: "Stripe",
            details: { event: event.type, payment_intent: pi.id },
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const submission = await Submission.findOne({ paymentIntentId: pi.id });
        if (submission) {
          submission.paymentStatus = "failed";
          await addActivity(submission, {
            action: "payment",
            description: "Payment failed",
            doneBy: "Stripe",
            details: { event: event.type, payment_intent: pi.id },
          });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const submissionId = session.metadata?.submission_id;
        if (submissionId) {
          const submission = await Submission.findById(submissionId);
          if (submission) {
            submission.paymentStatus = "failed";
            await addActivity(submission, {
              action: "payment",
              description: "Payment failed — session expired",
              doneBy: "Stripe",
              details: { event: event.type },
            });
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        // Try locate by payment intent
        const piId = charge.payment_intent;
        const submission = piId
          ? await Submission.findOne({ paymentIntentId: piId })
          : null;
        if (submission) {
          submission.paymentStatus = "refunded";
          await addActivity(submission, {
            action: "payment",
            description: `Refund processed — $${(charge.amount_refunded || 0) / 100}`,
            doneBy: "Stripe",
            details: { event: event.type, charge: charge.id },
          });
        }
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    res.status(500).json({ received: true });
  }
});

module.exports = { stripeWebhook };
