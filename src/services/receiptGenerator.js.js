const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const generatePaymentReceipt = (submission) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });

    const fileName = `receipt-${submission.orderNumber}.pdf`;
    const filePath = path.join(__dirname, `../../tmp/${fileName}`);

    if (!fs.existsSync(path.join(__dirname, "../../tmp"))) {
      fs.mkdirSync(path.join(__dirname, "../../tmp"));
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // LOGO
    const logoPath = path.join(__dirname, "../assets/nanak-logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 30, { width: 150 });
    }

    doc.moveDown(3);

    doc.fontSize(20).text("PAYMENT RECEIPT", { align: "right" });

    doc.moveDown(2);

    doc.fontSize(12).text(`Receipt Number: ${submission.orderNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Customer Name: ${submission.customerName}`);
    doc.text(`Email: ${submission.email}`);
    doc.text(`Service: ${submission.serviceName}`);
    doc.text(`Amount Paid: $${submission.amount}`);

    doc.moveDown(3);

    doc.text("Thank you for choosing Nanak Accountants.", { align: "center" });

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

module.exports = { generatePaymentReceipt };
