// Send confirmation to customer
const sendSubmissionConfirmationToUser = async (submission) => {
  const subject = "🎉 Submission Received Successfully";

  const html = `
    <h2>Congratulations ${submission.customerName || ''}!</h2>
    <p>Your information has been successfully submitted.</p>
    <p><strong>Service:</strong> ${submission.serviceName}</p>
    <p><strong>Order Number:</strong> ${submission.orderNumber || submission._id}</p>
    <br/>
    <p>Our team will contact you shortly.</p>
    <br/>
    <p>Regards,<br/>Support Team</p>
  `;

  await sendEmail({
    to: submission.email,
    subject,
    html,
  });
};


// Send notification to admin
const notifyAdminNewSubmission = async (submission) => {
  const subject = "🚀 New Submission Received";

  const html = `
    <h2>New Submission Alert</h2>
    <p><strong>Customer:</strong> ${submission.customerName}</p>
    <p><strong>Email:</strong> ${submission.email}</p>
    <p><strong>Service:</strong> ${submission.serviceName}</p>
    <p><strong>Amount:</strong> ${submission.amount}</p>
    <br/>
    <p>Please check admin panel.</p>
  `;

  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject,
    html,
  });
};

module.exports = {
  sendSubmissionConfirmationToUser,
  notifyAdminNewSubmission,
};