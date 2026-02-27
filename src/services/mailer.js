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
      subject: `🧾 New Submission - ${submission.serviceName} | ${submission.orderNumber}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%); padding:32px 40px; text-align:center;">
              <img src="cid:nanakLogo" alt="Nanak Accountants" width="160" style="margin-bottom:16px;" />
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                New Submission Received
              </h1>
              <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:14px;">
                A new order has been placed and is awaiting processing
              </p>
            </td>
          </tr>

          <!-- Order Badge -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef4fb;border-radius:12px;border:1px solid #d0e1f4;">
                <tr>
                  <td style="padding:16px 20px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#5a7da6;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Order Number</p>
                    <p style="margin:4px 0 0;font-size:24px;color:#1e3a5f;font-weight:800;letter-spacing:-0.5px;">${submission.orderNumber}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Service -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius:12px; border:1px solid #bbf7d0;">
                <tr>
                  <td style="padding:16px 20px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#15803d;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Service</p>
                    <p style="margin:4px 0 0;font-size:18px;color:#166534;font-weight:700;">${submission.serviceName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Details -->
          <tr>
            <td style="padding:24px 40px;">
              <h2 style="margin:0 0 16px;font-size:15px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">
                Customer Details
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 16px;background:#f8fafc;border-radius:8px;margin-bottom:8px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" valign="top" style="padding-right:12px;">
                          <div style="width:36px;height:36px;background:#e0e7ff;border-radius:8px;text-align:center;line-height:36px;font-size:16px;">👤</div>
                        </td>
                        <td>
                          <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Full Name</p>
                          <p style="margin:2px 0 0;font-size:16px;color:#1e293b;font-weight:600;">${submission.customerName}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#f8fafc;border-radius:8px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" valign="top" style="padding-right:12px;">
                          <div style="width:36px;height:36px;background:#fce7f3;border-radius:8px;text-align:center;line-height:36px;font-size:16px;">📧</div>
                        </td>
                        <td>
                          <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Email</p>
                          <p style="margin:2px 0 0;font-size:16px;color:#1e293b;font-weight:600;">${submission.email}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#f8fafc;border-radius:8px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" valign="top" style="padding-right:12px;">
                          <div style="width:36px;height:36px;background:#e0f2fe;border-radius:8px;text-align:center;line-height:36px;font-size:16px;">📱</div>
                        </td>
                        <td>
                          <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Phone</p>
                          <p style="margin:2px 0 0;font-size:16px;color:#1e293b;font-weight:600;">${submission.phone}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Amount -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 100%);border-radius:12px;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Total Amount</p>
                    <p style="margin:6px 0 0;font-size:36px;color:#ffffff;font-weight:800;letter-spacing:-1px;">$${submission.amount}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.5);">inc. GST</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                This is an automated notification from <strong style="color:#64748b;">Nanak Accountants</strong>
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">
                © ${new Date().getFullYear()} Nanak Accountants. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      attachments: [
        {
          filename: "logo-nanak.webp",
          path: path.join(__dirname, "assets", "logo-nanak.webp"),
          cid: "nanakLogo",
        },
      ],
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
