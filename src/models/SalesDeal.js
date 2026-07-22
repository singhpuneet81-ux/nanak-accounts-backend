const mongoose = require('mongoose');

const DEAL_TYPES = ['new', 'upsell', 'renewal', 'react'];
const DEAL_STAGES = [
  'Draft',
  'Proposal sent',
  'Awaiting acceptance',
  'Won',
  'Payment setup pending',
  'Onboarding pending',
  'Active / At risk',
  'Active / Protected',
  'Cancelled / within retention',
  'Cancelled / after retention',
  'Cancelled before activation',
  'Voided',
];

const salesDealSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesClient', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: DEAL_TYPES, required: true },
    service: { type: String, default: '' },
    stage: { type: String, default: 'Draft' },
    annualFeeCents: { type: Number, default: 0 },
    prevFeeCents: { type: Number, default: 0 },
    eligibleNewCents: { type: Number, default: 0 },
    rateSnapshot: { type: Number, default: null },
    quoteDate: { type: String, default: null },
    proposalDate: { type: String, default: null },
    signedAt: { type: String, default: null },
    paymentSetupCompletedAt: { type: String, default: null },
    onboardingCompletedAt: { type: String, default: null },
    activationDate: { type: String, default: null },
    retentionDaysSnapshot: { type: Number, default: null },
    retentionMaturityDate: { type: String, default: null },
    firstYearMonthsSnapshot: { type: Number, default: null },
    commissionWindowEndDate: { type: String, default: null },
    billing: { type: String, default: 'Monthly' },
    ignitionId: { type: String, default: '' },
    quotePadRef: { type: String, default: '' },
    notes: { type: String, default: '' },
    cancelDate: { type: String, default: null },
    cancelReason: { type: String, default: '' },
    voided: { type: Boolean, default: false },
    voidReason: { type: String, default: '' },
    split: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

salesDealSchema.index({ ownerId: 1, signedAt: 1 });

module.exports = mongoose.model('SalesDeal', salesDealSchema);
module.exports.DEAL_TYPES = DEAL_TYPES;
module.exports.DEAL_STAGES = DEAL_STAGES;
