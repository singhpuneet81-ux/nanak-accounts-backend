/**
 * Receipt / Invoice PDF Generator
 * Generates a professional PDF matching the Nanak Accountants invoice format.
 *
 * Dependencies: npm install pdfkit
 *
 * Invoice layout matches the reference (INV-10523 style):
 * - Nanak Accountants header with logo
 * - Invoice number, date, due date
 * - Customer details
 * - Line items table (Description, Qty, Unit Price, GST, Amount)
 * - Subtotal, GST (10%), Total
 * - Payment details (bank info)
 * - Payment advice tear-off section
 */

const PDFDocument = require("pdfkit");
const path = require("path");

/**
 * @param {Object} submission - The submission document from MongoDB
 * @param {Object} options - { paymentIntentId, currency }
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePaymentReceipt(submission, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const amount = Number(submission.amount || 0);
      const gst = Math.round((amount / 11) * 100) / 100; // Australian GST: divide by 11
      const subtotal = Math.round((amount - gst) * 100) / 100;
      const invoiceDate = new Date().toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // ─── HEADER ───
      // Logo (if available)
      const logoPath = path.resolve("src/assets/logo-nanak.webp");
      try {
        doc.image(logoPath, 50, 40, { width: 180 });
      } catch (e) {
        doc.fontSize(20).font("Helvetica-Bold").text("Nanak Accountants", 50, 45);
      }

      // TAX INVOICE title
      doc.fontSize(22).font("Helvetica-Bold").fillColor("#1a1a1a");
      doc.text("TAX INVOICE", 350, 45, { align: "right" });

      // Invoice date
      doc.fontSize(10).font("Helvetica").fillColor("#666666");
      doc.text(`Invoice Date: ${invoiceDate}`, 350, 75, { align: "right" });

      // ─── BUSINESS DETAILS ───
      doc.moveDown(2);
      const yBiz = 110;
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#1a1a1a");
      doc.text("Nanak Accountants & Associates", 50, yBiz);
      doc.fontSize(9).font("Helvetica").fillColor("#666666");
      doc.text("46 Vautier Avenue", 50, yBiz + 16);
      doc.text("Mickleham 3064", 50, yBiz + 28);
      doc.text("ABN: 47 648 226 804", 50, yBiz + 40);

      // ─── CUSTOMER & INVOICE INFO ───
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#1a1a1a");
      doc.text(submission.customerName || "Customer", 350, yBiz, { align: "right" });
      doc.fontSize(9).font("Helvetica").fillColor("#666666");
      doc.text(`Invoice Number: ${submission.orderNumber}`, 350, yBiz + 16, { align: "right" });
      if (submission.email) {
        doc.text(submission.email, 350, yBiz + 28, { align: "right" });
      }

      // ─── DIVIDER ───
      const yDiv = yBiz + 65;
      doc.moveTo(50, yDiv).lineTo(545, yDiv).strokeColor("#E0E0E0").lineWidth(1).stroke();

      // ─── TABLE HEADER ───
      const tableTop = yDiv + 15;
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#333333");
      doc.text("Description", 50, tableTop, { width: 250 });
      doc.text("Qty", 310, tableTop, { width: 40, align: "center" });
      doc.text("Unit Price", 355, tableTop, { width: 60, align: "right" });
      doc.text("GST", 420, tableTop, { width: 40, align: "center" });
      doc.text("Amount AUD", 465, tableTop, { width: 80, align: "right" });

      // Table header line
      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor("#CCCCCC").stroke();

      // ─── TABLE ROW ───
      const rowY = tableTop + 25;
      doc.fontSize(9).font("Helvetica").fillColor("#333333");
      doc.text(submission.serviceName || "Professional Services", 50, rowY, { width: 250 });
      doc.text("1.00", 310, rowY, { width: 40, align: "center" });
      doc.text(subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2 }), 355, rowY, { width: 60, align: "right" });
      doc.text("10%", 420, rowY, { width: 40, align: "center" });
      doc.text(subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2 }), 465, rowY, { width: 80, align: "right" });

      // ─── TOTALS ───
      const totalsY = rowY + 40;
      doc.moveTo(350, totalsY).lineTo(545, totalsY).strokeColor("#E0E0E0").stroke();

      doc.fontSize(10).font("Helvetica").fillColor("#333333");
      doc.text("Subtotal:", 350, totalsY + 10, { width: 100, align: "right" });
      doc.text(subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2 }), 465, totalsY + 10, { width: 80, align: "right" });

      doc.text("TOTAL GST 10%:", 350, totalsY + 28, { width: 100, align: "right" });
      doc.text(gst.toLocaleString("en-AU", { minimumFractionDigits: 2 }), 465, totalsY + 28, { width: 80, align: "right" });

      doc.moveTo(350, totalsY + 46).lineTo(545, totalsY + 46).strokeColor("#1a1a1a").lineWidth(2).stroke();

      doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a1a1a");
      doc.text("TOTAL AUD:", 350, totalsY + 54, { width: 100, align: "right" });
      doc.text(amount.toLocaleString("en-AU", { minimumFractionDigits: 2 }), 465, totalsY + 54, { width: 80, align: "right" });

      // ─── PAYMENT DETAILS ───
      const payY = totalsY + 90;
      doc.fontSize(9).font("Helvetica").fillColor("#666666");
      doc.text(`Due Date: ${invoiceDate}`, 50, payY);
      doc.moveDown(1);
      doc.font("Helvetica-Bold").fillColor("#333333");
      doc.text("Payment Details:", 50, payY + 20);
      doc.font("Helvetica").fillColor("#666666");
      doc.text("Commonwealth Bank", 50, payY + 34);
      doc.text("Nanak Associates Pty Ltd", 50, payY + 46);
      doc.text("BSB: 063-135", 50, payY + 58);
      doc.text("A/C: 10887403", 50, payY + 70);

      // ─── FOOTER NOTE ───
      doc.moveDown(3);
      doc.fontSize(8).font("Helvetica").fillColor("#999999");
      doc.text(
        "Services will not commence without payment, and tax lodgement is the client's responsibility.",
        50,
        payY + 100,
        { align: "center", width: 495 }
      );

      // ─── PAYMENT ADVICE SECTION ───
      const adviceY = payY + 130;
      doc.moveTo(50, adviceY).lineTo(545, adviceY).dash(5, { space: 3 }).strokeColor("#CCCCCC").lineWidth(1).stroke();
      doc.undash();

      doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a1a1a");
      doc.text("PAYMENT ADVICE", 50, adviceY + 15);

      doc.fontSize(9).font("Helvetica").fillColor("#333333");
      doc.text(`Customer: ${submission.customerName || "Customer"}`, 50, adviceY + 35);
      doc.text(`Invoice Number: ${submission.orderNumber}`, 50, adviceY + 49);
      doc.text(`Amount Due: ${amount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`, 50, adviceY + 63);
      doc.text(`Due Date: ${invoiceDate}`, 50, adviceY + 77);

      doc.fontSize(9).font("Helvetica").fillColor("#333333");
      doc.text("To: Nanak Accountants & Associates", 350, adviceY + 35, { align: "right" });
      doc.text("46 Vautier Avenue", 350, adviceY + 49, { align: "right" });
      doc.text("Mickleham 3064", 350, adviceY + 63, { align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePaymentReceipt };
