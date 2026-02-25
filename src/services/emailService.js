const { sendMail } = require('./mailer');

async function sendSubmissionConfirmationToUser(submission) {
  const subject = `Submission received - ${submission.orderNumber}`;
  const html = `
    <h2>Thanks! We received your submission ✅</h2>
    <p>Order: <b>${submission.orderNumber}</b></p>
    <p>Service: <b>${submission.serviceName}</b></p>
    <p>We’ll contact you shortly.</p>
  `;
  return sendMail({ to: submission.email, subject, html, text: `We received your submission. Order: ${submission.orderNumber}` });
}

async function notifyAdminNewSubmission(submission) {
  const subject = `New submission - ${submission.orderNumber}`;
  const html = `
    <h2>New Submission 🚀</h2>
    <p>Order: <b>${submission.orderNumber}</b></p>
    <p>Name: <b>${submission.customerName}</b></p>
    <p>Email: <b>${submission.email}</b></p>
    <p>Service: <b>${submission.serviceName}</b></p>
    <p>Amount: <b>${submission.amount}</b> | Payment: <b>${submission.paymentStatus}</b></p>
  `;
  return sendMail({ to: process.env.ADMIN_NOTIFY_EMAIL, subject, html, text: `New submission: ${submission.orderNumber}` });
}

module.exports = {
  sendSubmissionConfirmationToUser,
  notifyAdminNewSubmission,
  // keep your existing exports too
};