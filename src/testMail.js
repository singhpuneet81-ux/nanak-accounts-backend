require("dotenv").config();
const {
  notifyAdminNewSubmission,
  sendPaymentSuccessEmailToUser,
} = require("./services/emailService");

(async () => {
  const fakeSubmission = {
    orderNumber: "TEST123",
    serviceName: "Test Service",
    customerName: "Test User",
    email: "y",
    phone: "1234567890",
    amount: 100,
    stripeCheckoutSessionId: "sess_test_123",
  };

  try {
    await notifyAdminNewSubmission(fakeSubmission);
    console.log("✅ Admin mail test success");

    await sendPaymentSuccessEmailToUser(fakeSubmission);
    console.log("✅ Payment mail test success");
  } catch (err) {
    console.error("❌ Mail test failed:", err);
  }

  process.exit();
})();