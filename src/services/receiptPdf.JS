const PDFDocument = require("pdfkit");

/**
 * Generates receipt PDF as Buffer (no disk file needed)
 */
function generateReceiptPdf(submission, paymentInfo = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });

      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ---------- PDF CONTENT ----------
      doc.fontSize(18).text("Nanak Accountants", { align: "left" });
      doc.moveDown(0.5);
      doc.fontSize(12).text("Payment Receipt / Invoice", { align: "left" });

      doc.moveDown();
      doc.fontSize(10).text(`Order Number: ${submission.orderNumber}`);
      doc.text(`Submission ID: ${String(submission._id)}`);
      doc.text(`Service: ${submission.serviceName}`);
      doc.text(`Customer: ${submission.customerName}`);
      doc.text(`Customer Email: ${submission.email}`);
      doc.text(`Payment Status: ${submission.paymentStatus}`);
      doc.text(`Payment Date: ${submission.paymentCompletedAt || new Date()}`);

      doc.moveDown();
      doc.fontSize(12).text("Amount Summary");
      doc.fontSize(10).text(`Amount Paid: $${Number(submission.amount || 0).toFixed(2)}`);
      if (paymentInfo.paymentIntentId) doc.text(`Payment Intent: ${paymentInfo.paymentIntentId}`);
      if (paymentInfo.currency) doc.text(`Currency: ${paymentInfo.currency.toUpperCase()}`);

      doc.moveDown();
      doc.fontSize(10).text(
        "Note: This is a system-generated receipt. For support, contact Info@nanakaccountants.com.au"
      );

      // Finish PDF
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { generateReceiptPdf };