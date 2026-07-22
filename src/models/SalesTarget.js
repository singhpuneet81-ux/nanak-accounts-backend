const mongoose = require('mongoose');

const salesTargetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fy: { type: String, required: true },
    amountCents: { type: Number, required: true },
    effectiveDate: { type: String, required: true },
    reason: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

salesTargetSchema.index({ userId: 1, fy: 1, effectiveDate: 1 });

module.exports = mongoose.model('SalesTarget', salesTargetSchema);
