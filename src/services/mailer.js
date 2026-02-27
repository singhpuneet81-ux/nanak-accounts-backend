const nodemailer = require("nodemailer");
const { generatePaymentReceipt } = require("./receiptGenerator.js");
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

async function sendPaymentSuccessEmailToUser(submission) {
  console.log("📩 [USER MAIL] Preparing payment success email...");
  console.log("📩 [USER MAIL] To:", submission.email);

  // 1) Generate PDF Buffer
  const pdfBuffer = await generateReceiptPdf(submission, {
    paymentIntentId: submission.paymentIntentId,
    currency: "aud",
  });

  console.log("📎 [USER MAIL] PDF generated. Size:", pdfBuffer.length, "bytes");

  // 2) Send Email with attachment
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || "Info@nanakaccountants.com.au",
    to: submission.email,
    subject: `Payment Received - ${submission.orderNumber}`,
    html: `
      <p>Hi ${submission.customerName || "Customer"},</p>
      <p>Your payment has been received successfully for <b>${submission.serviceName}</b>.</p>
      <p><b>Order:</b> ${submission.orderNumber}<br/>
         <b>Amount:</b> $${Number(submission.amount || 0).toFixed(2)}</p>
      <p>Please find your receipt/invoice attached as a PDF.</p>
      <p>Thanks,<br/>Nanak Accountants</p>
    `,
    attachments: [
      {
        filename: `Receipt-${submission.orderNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  console.log("✅ [USER MAIL] Sent. MessageId:", info.messageId);
  return info;
}

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
