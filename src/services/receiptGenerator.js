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

      // ===== CALCULATIONS =====
      const amount = Number(submission.amount || 0);
      const gst = +(amount / 11).toFixed(2);
      const subtotal = +(amount - gst).toFixed(2);

      const invoiceDate = new Date().toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const dueDate = invoiceDate;

      // ===== LOGO (PNG ONLY) =====
   try {
  const logoPath = path.join(__dirname, "../assets/logo-nanak.jpg");

  console.log("🔍 Logo path:", logoPath);

  doc.image(logoPath, 50, 40, { width: 160 });
} catch (err) {
  console.error("❌ Logo load failed:", err.message);
  doc.fontSize(18).font("Helvetica-Bold");
  doc.text("Nanak Accountants", 50, 45);
}

      // ===== TAX INVOICE TITLE =====
      doc.fontSize(22).font("Helvetica-Bold").fillColor("#000");
      doc.text("TAX INVOICE", 350, 50, { align: "right" });

      // ===== INVOICE DATE =====
      doc.fontSize(10).font("Helvetica").fillColor("#555");
      doc.text(`Invoice Date: ${invoiceDate}`, 350, 75, { align: "right" });

      // ===== BUSINESS DETAILS =====
      const yStart = 120;

      doc.fontSize(11).font("Helvetica-Bold").fillColor("#000");
      doc.text("Nanak Accountants & Associates", 50, yStart);

      doc.fontSize(9).font("Helvetica").fillColor("#555");
      doc.text("46 Vautier Avenue", 50, yStart + 16);
      doc.text("Mickleham 3064", 50, yStart + 28);
      doc.text("ABN: 47 648 226 804", 50, yStart + 40);

      // ===== CUSTOMER INFO =====
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#000");
      doc.text(submission.customerName || "Customer", 350, yStart);

      doc.fontSize(9).font("Helvetica").fillColor("#555");
      doc.text(`Invoice Number: ${submission.orderNumber}`, 350, yStart + 16);

      if (submission.email) {
        doc.text(submission.email, 350, yStart + 28);
      }

      // ===== DIVIDER =====
      const dividerY = yStart + 70;
      doc.moveTo(50, dividerY).lineTo(545, dividerY).strokeColor("#DDD").stroke();

      // ===== TABLE HEADER =====
      const tableTop = dividerY + 20;

      doc.fontSize(9).font("Helvetica-Bold").fillColor("#000");
      doc.text("Description", 50, tableTop);
      doc.text("Quantity", 300, tableTop);
      doc.text("Unit Price", 360, tableTop);
      doc.text("GST", 440, tableTop);
      doc.text("Amount AUD", 480, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor("#CCC").stroke();

      // ===== TABLE ROW =====
      const rowY = tableTop + 25;

      doc.fontSize(9).font("Helvetica").fillColor("#000");
      doc.text(submission.serviceName || "Professional Services", 50, rowY, { width: 240 });
      doc.text("1.00", 300, rowY);
      doc.text(subtotal.toFixed(2), 360, rowY);
      doc.text("10%", 440, rowY);
      doc.text(subtotal.toFixed(2), 480, rowY);

      // ===== TOTALS =====
      const totalsY = rowY + 50;

      doc.moveTo(350, totalsY).lineTo(545, totalsY).strokeColor("#DDD").stroke();

      doc.fontSize(10).font("Helvetica");
      doc.text("Subtotal", 350, totalsY + 10);
      doc.text(subtotal.toFixed(2), 480, totalsY + 10);

      doc.text("TOTAL GST 10%", 350, totalsY + 28);
      doc.text(gst.toFixed(2), 480, totalsY + 28);

      doc.moveTo(350, totalsY + 46).lineTo(545, totalsY + 46).strokeColor("#000").lineWidth(1.5).stroke();

      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("TOTAL AUD", 350, totalsY + 54);
      doc.text(amount.toFixed(2), 480, totalsY + 54);

      // ===== PAYMENT DETAILS =====
      const payY = totalsY + 95;

      doc.fontSize(9).font("Helvetica").fillColor("#555");
      doc.text(`Due Date: ${dueDate}`, 50, payY);

      doc.font("Helvetica-Bold").fillColor("#000");
      doc.text("Payment Details :", 50, payY + 20);

      doc.font("Helvetica").fillColor("#555");
      doc.text("Commonwealth Bank", 50, payY + 35);
      doc.text("Nanak Associates Pty Ltd", 50, payY + 48);
      doc.text("BSB : 063-135", 50, payY + 61);
      doc.text("A/C : 10887403", 50, payY + 74);

      // ===== FOOTER NOTE =====
      doc.fontSize(8).fillColor("#888");
      doc.text(
        "Services will not commence without payment, and tax lodgement is the client's responsibility",
        50,
        payY + 100,
        { align: "center", width: 495 }
      );

      
      // ===== PAYMENT ADVICE =====
      const adviceY = payY + 140;

      doc.moveTo(50, adviceY)
        .lineTo(545, adviceY)
        .dash(4, { space: 3 })
        .strokeColor("#CCC")
        .stroke();
      doc.undash();

      doc.fontSize(12).font("Helvetica-Bold").fillColor("#000");
      doc.text("PAYMENT ADVICE", 50, adviceY + 15);

      doc.fontSize(9).font("Helvetica").fillColor("#000");

      doc.text(`Customer: ${submission.customerName}`, 50, adviceY + 40);
      doc.text(`Invoice Number: ${submission.orderNumber}`, 50, adviceY + 55);
      doc.text(`Amount Due: ${amount.toFixed(2)}`, 50, adviceY + 70);
      doc.text(`Due Date: ${dueDate}`, 50, adviceY + 85);

      doc.text("To: Nanak Accountants & Associates", 350, adviceY + 40);
      doc.text("46 Vautier Avenue", 350, adviceY + 55);
      doc.text("Mickleham 3064", 350, adviceY + 70);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePaymentReceipt };

