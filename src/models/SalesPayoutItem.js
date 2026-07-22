const mongoose = require('mongoose');

const salesPayoutItemSchema = new mongoose.Schema(
  {
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesPayoutBatch', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    openingCents: { type: Number, default: 0 },
    earnCents: { type: Number, default: 0 },
    clawbackCents: { type: Number, default: 0 },
    netCents: { type: Number, default: 0 },
    carryCents: { type: Number, default: 0 },
    inrAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalesPayoutItem', salesPayoutItemSchema);
