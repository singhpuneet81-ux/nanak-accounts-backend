const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.office365.com',
  port: Number(process.env.MAIL_PORT || 587),
  secure: false, // STARTTLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
  },
});

async function sendMail({ to, subject, html, text }) {
  return transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || 'Nanak Accounts'}" <${process.env.MAIL_FROM_EMAIL || process.env.MAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendMail, transporter };