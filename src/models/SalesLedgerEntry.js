const mongoose = require('mongoose');

const salesLedgerEntrySchema = new mongoose.Schema(
  {
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesDeal', required: true, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesPayment', default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['credit', 'clawback', 'refund', 'adjustment'], required: true },
    amountCents: { type: Number, required: true },
    rate: { type: Number, default: null },
    note: { type: String, default: '' },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesPayoutBatch', default: null },
    paid: { type: Boolean, default: false },
    paidAt: { type: String, default: null },
    cancelled: { type: Boolean, default: false },
    eligibleAt: { type: String, default: null },
    ts: { type: String, required: true },
  },
  { timestamps: true }
);

salesLedgerEntrySchema.index(
  { paymentId: 1 },
  { unique: true, partialFilterExpression: { kind: 'credit', paymentId: { $type: 'objectId' } } }
);

module.exports = mongoose.model('SalesLedgerEntry', salesLedgerEntrySchema);
