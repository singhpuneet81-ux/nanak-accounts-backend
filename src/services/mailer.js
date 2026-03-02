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


const path = require("path");

// Replace the attachments section with:
attachments: [{
  filename: "logo-nanak.webp",
  path: path.resolve("src/assets/logo-nanak.webp"),
  cid: "nanakLogo"
}]

const notifyAdminNewSubmission = async (submission) => {
  console.log("📩 [ADMIN MAIL START] New submission:", submission.orderNumber);

  try {
    const info = await transporter.sendMail({
   from: `"Nanak Accountants" <${process.env.MAIL_FROM || "noreply@nanakaccountants.com.au"}>`,
      to: ["shivanshunigam8@gmail.com", "singh.puneet81@gmail.com"],
      subject: `🧾 New Submission - ${submission.serviceName} | ${submission.orderNumber}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f,#2d6cbe);padding:30px;text-align:center;">
              <img src="https://nanak-accounts-backend.onrender.com/assets/logo-nanak.webp" alt="Nanak Accountants" width="160" style="margin-bottom:16px;" />
              <h1 style="color:#ffffff;font-size:22px;margin:0;">New Submission Received</h1>
              <p style="color:#cbe0ff;font-size:14px;margin:8px 0 0;">A new order has been placed and is awaiting processing</p>
            </td>
          </tr>

          <!-- Order Number -->
          <tr>
            <td style="padding:24px 30px 0;">
              <table width="100%" style="background:#eef4fb;border-radius:8px;padding:14px 20px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#5a7a9b;text-transform:uppercase;">Order Number</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:bold;color:#1e3a5f;">${submission.orderNumber}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Service -->
          <tr>
            <td style="padding:16px 30px 0;">
              <table width="100%" style="background:#eef4fb;border-radius:8px;padding:14px 20px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#5a7a9b;text-transform:uppercase;">Service</p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:bold;color:#1e3a5f;">${submission.serviceName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Details -->
          <tr>
            <td style="padding:24px 30px 0;">
              <h2 style="font-size:16px;color:#1e3a5f;margin:0 0 12px;border-bottom:2px solid #eef4fb;padding-bottom:8px;">Customer Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <table><tr>
                      <td style="font-size:22px;padding-right:12px;vertical-align:top;">👤</td>
                      <td>
                        <p style="margin:0;font-size:11px;color:#8899aa;text-transform:uppercase;">Full Name</p>
                        <p style="margin:2px 0 0;font-size:15px;color:#1e3a5f;font-weight:600;">${submission.customerName}</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <table><tr>
                      <td style="font-size:22px;padding-right:12px;vertical-align:top;">📧</td>
                      <td>
                        <p style="margin:0;font-size:11px;color:#8899aa;text-transform:uppercase;">Email</p>
                        <p style="margin:2px 0 0;font-size:15px;color:#1e3a5f;font-weight:600;">${submission.email}</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <table><tr>
                      <td style="font-size:22px;padding-right:12px;vertical-align:top;">📱</td>
                      <td>
                        <p style="margin:0;font-size:11px;color:#8899aa;text-transform:uppercase;">Phone</p>
                        <p style="margin:2px 0 0;font-size:15px;color:#1e3a5f;font-weight:600;">${submission.phone}</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Total Amount -->
          <tr>
            <td style="padding:24px 30px;">
              <table width="100%" style="background:linear-gradient(135deg,#1e3a5f,#2d6cbe);border-radius:10px;padding:20px;text-align:center;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#cbe0ff;text-transform:uppercase;">Total Amount</p>
                    <p style="margin:6px 0 2px;font-size:32px;font-weight:bold;color:#ffffff;">$${submission.amount}</p>
                    <p style="margin:0;font-size:12px;color:#a8ccf0;">inc. GST</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fb;padding:20px 30px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:12px;color:#999;">This is an automated notification from Nanak Accountants</p>
              <p style="margin:6px 0 0;font-size:11px;color:#bbb;">© ${new Date().getFullYear()} Nanak Accountants. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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
  const pdfBuffer = await generatePaymentReceipt(submission, {
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
  try {
    const amount = Number(submission.amount || 0);
    const gst = +(amount / 11).toFixed(2);
    const subtotal = +(amount - gst).toFixed(2);

    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width:650px; margin:auto;">

        <div style="background:#111; padding:18px; text-align:center;">
          <h2 style="color:#fff; margin:0;">Nanak Accountants</h2>
        </div>

        <div style="padding:20px; background:#f9f9f9;">
          <h3 style="margin-top:0;">💰 Payment Received</h3>

          <table style="width:100%; border-collapse:collapse; margin-top:15px;">
            <tr>
              <td style="padding:8px; border:1px solid #ddd;"><b>Customer Name</b></td>
              <td style="padding:8px; border:1px solid #ddd;">${submission.customerName}</td>
            </tr>
            <tr>
              <td style="padding:8px; border:1px solid #ddd;"><b>Email</b></td>
              <td style="padding:8px; border:1px solid #ddd;">${submission.email}</td>
            </tr>
            <tr>
              <td style="padding:8px; border:1px solid #ddd;"><b>Order Number</b></td>
              <td style="padding:8px; border:1px solid #ddd;">${submission.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding:8px; border:1px solid #ddd;"><b>Service</b></td>
              <td style="padding:8px; border:1px solid #ddd;">${submission.serviceName}</td>
            </tr>
            <tr>
              <td style="padding:8px; border:1px solid #ddd;"><b>Subtotal</b></td>
              <td style="padding:8px; border:1px solid #ddd;">$${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:8px; border:1px solid #ddd;"><b>GST (10%)</b></td>
              <td style="padding:8px; border:1px solid #ddd;">$${gst.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:8px; border:1px solid #ddd;"><b>Total Paid</b></td>
              <td style="padding:8px; border:1px solid #ddd;"><b>$${amount.toFixed(
                2
              )}</b></td>
            </tr>
            <tr>
              <td style="padding:8px; border:1px solid #ddd;"><b>Stripe Session ID</b></td>
              <td style="padding:8px; border:1px solid #ddd;">${submission.stripeCheckoutSessionId}</td>
            </tr>
          </table>

          <br/>

          <p style="font-size:12px; color:#777;">
            This is an automated payment confirmation from the Nanak Accountants system.
          </p>

        </div>
      </div>
    `;

    return transporter.sendMail({
     from: `"Nanak Accountants" <${process.env.MAIL_FROM || "noreply@nanakaccountants.com.au"}>`,
      to: ["shivanshunigam8@gmail.com", "singh.puneet81@gmail.com"],
      subject: `Payment Received - ${submission.orderNumber}`,
      html: htmlTemplate,
    });
  } catch (err) {
    console.error("❌ Admin email failed:", err.message);
    throw err;
  }
};

module.exports = {
  notifyAdminNewSubmission,
  sendPaymentSuccessEmailToUser,
  notifyAdminPaymentReceived,
};
