const mongoose = require('mongoose');

const salesPaymentSchema = new mongoose.Schema(
  {
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesDeal', required: true, index: true },
    reference: { type: String, required: true, unique: true },
    paidOn: { type: String, required: true },
    grossCents: { type: Number, required: true },
    gstCents: { type: Number, default: 0 },
    excludedCents: { type: Number, default: 0 },
    eligibleNetCents: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'cleared', 'failed', 'refunded', 'rejected'], default: 'pending' },
    source: { type: String, default: 'manual' },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
    rejectReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalesPayment', salesPaymentSchema);
