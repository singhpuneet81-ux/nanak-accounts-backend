const mongoose = require('mongoose');

const salesClawbackCaseSchema = new mongoose.Schema(
  {
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesDeal', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    activationDate: { type: String, default: null },
    maturityDate: { type: String, default: null },
    cancelDate: { type: String, default: null },
    daysRetained: { type: Number, default: 0 },
    reason: { type: String, default: '' },
    accruedCents: { type: Number, default: 0 },
    paidCents: { type: Number, default: 0 },
    clawbackCents: { type: Number, default: 0 },
    recoveredCents: { type: Number, default: 0 },
    waivedCents: { type: Number, default: 0 },
    outstandingCents: { type: Number, default: 0 },
    status: { type: String, enum: ['Recovering', 'Recovered', 'Waived', 'Closed'], default: 'Recovering' },
    waiver: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalesClawbackCase', salesClawbackCaseSchema);
