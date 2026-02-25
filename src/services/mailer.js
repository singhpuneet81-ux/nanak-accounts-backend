const nodemailer = require("nodemailer");
const { generatePaymentReceipt } = require("../services/receiptGenerator.js");
// const transporter = nodemailer.createTransport({
//   host: process.env.MAIL_HOST || 'smtp.office365.com',
//   port: Number(process.env.MAIL_PORT || 587),
//   secure: false, // STARTTLS
//   auth: {
//     user: process.env.MAIL_USER,
//     pass: process.env.MAIL_PASS,
//   },
//   tls: {
//     ciphers: 'SSLv3',
//   },
// });

// async function sendMail({ to, subject, html, text }) {
//   return transporter.sendMail({
//     from: `"${process.env.MAIL_FROM_NAME || 'Nanak Accounts'}" <${process.env.MAIL_FROM_EMAIL || process.env.MAIL_USER}>`,
//     to,
//     subject,
//     text,
//     html,
//   });
// }

// module.exports = { sendMail, transporter };

const transporter = require("nodemailer").createTransport({
  host: "mail.premium.exchange",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;

const notifyAdminNewSubmission = async (submission) => {
  console.log("📩 [ADMIN MAIL START] New submission:", submission.orderNumber);

  try {
    const info = await transporter.sendMail({
      from: `"Nanak Accountants" <${process.env.MAIL_USER}>`,
      to: ["shivanshunigam8@gmail.com", "singh.puneet81@gmail.com"],
      subject: `New Submission - ${submission.serviceName}`,
      html: `
        <h2>New Submission Received</h2>
        <p><strong>Order:</strong> ${submission.orderNumber}</p>
        <p><strong>Name:</strong> ${submission.customerName}</p>
        <p><strong>Email:</strong> ${submission.email}</p>
        <p><strong>Phone:</strong> ${submission.phone}</p>
        <p><strong>Amount:</strong> $${submission.amount}</p>
      `,
    });

    console.log("✅ [ADMIN MAIL SENT]");
    console.log("📨 [ADMIN MAIL RESPONSE]", info.response);

    return info;
  } catch (error) {
    console.error("❌ [ADMIN MAIL ERROR]", error.message);
    throw error;
  }
};

const sendPaymentSuccessEmailToUser = async (submission) => {
  console.log("📧 [MAIL START] Payment email for:", submission.orderNumber);

  // 1️⃣ Generate PDF
  const receiptPath = await generatePaymentReceipt(submission);
  console.log("📎 [PDF GENERATED]", receiptPath);

  try {
    const info = await transporter.sendMail({
      from: `"Nanak Accountants" <${process.env.MAIL_USER}>`,
      to: submission.email,
      subject: "Payment Successful – Nanak Accountants",
      html: `
        <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:30px;">
          <div style="max-width:600px; background:white; padding:30px; border-radius:8px;">
            
            <h2 style="color:#1a237e;">Payment Successful 🎉</h2>
            
            <p>Hi <strong>${submission.customerName}</strong>,</p>

            <p>We have successfully received your payment.</p>

            <table style="width:100%;">
              <tr>
                <td><strong>Order Number:</strong></td>
                <td>${submission.orderNumber}</td>
              </tr>
              <tr>
                <td><strong>Service:</strong></td>
                <td>${submission.serviceName}</td>
              </tr>
              <tr>
                <td><strong>Amount Paid:</strong></td>
                <td>$${submission.amount}</td>
              </tr>
            </table>

            <br/>
            <p>Your receipt is attached to this email.</p>

            <br/>
            <p>Regards,<br/>
            <strong>Nanak Accountants Team</strong></p>

          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Receipt-${submission.orderNumber}.pdf`,
          path: receiptPath,
        },
      ],
    });

    console.log("✅ [MAIL SENT] To:", submission.email);
    console.log("📨 [MAIL RESPONSE]", info.response);

    return info;
  } catch (error) {
    console.error("❌ [MAIL ERROR]", error.message);
    throw error;
  } finally {
    if (receiptPath && fs.existsSync(receiptPath)) {
      fs.unlinkSync(receiptPath);
      console.log("🧹 [CLEANUP] Temp receipt deleted");
    }

    console.log("📧 [MAIL END] Process completed for:", submission.orderNumber);
  }
};

const notifyAdminPaymentReceived = async (submission) => {
  return transporter.sendMail({
    from: `"Nanak Accountants" <${process.env.MAIL_USER}>`,
    to: ["shivanshunigam8@gmail.com", "singh.puneet81@gmail.com"],
    subject: `Payment Received - ${submission.orderNumber}`,
    html: `
      <h2>Payment Received</h2>
      <p><strong>Customer:</strong> ${submission.customerName}</p>
      <p><strong>Email:</strong> ${submission.email}</p>
      <p><strong>Amount:</strong> $${submission.amount}</p>
      <p><strong>Stripe Session:</strong> ${submission.stripeCheckoutSessionId}</p>
    `,
  });
};

module.exports = {
  notifyAdminNewSubmission,
  sendPaymentSuccessEmailToUser,
  notifyAdminPaymentReceived,
};
