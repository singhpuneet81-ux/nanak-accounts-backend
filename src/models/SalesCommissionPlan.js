const mongoose = require('mongoose');

const salesCommissionPlanSchema = new mongoose.Schema(
  {
    rate: { type: Number, required: true },
    effectiveDate: { type: String, required: true },
    reason: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

salesCommissionPlanSchema.index({ effectiveDate: 1 }, { unique: true });

module.exports = mongoose.model('SalesCommissionPlan', salesCommissionPlanSchema);
