const mongoose = require('mongoose');

const salesPayoutBatchSchema = new mongoose.Schema(
  {
    period: { type: String, required: true },
    label: { type: String, required: true },
    cutoffDate: { type: String, required: true },
    frequency: { type: String, default: 'quarterly' },
    state: {
      type: String,
      enum: ['draft', 'review', 'approved', 'paid', 'locked', 'void'],
      default: 'draft',
    },
    fxRate: { type: Number, default: null },
    opening: { type: Map, of: Number, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    paidAt: { type: String, default: null },
    payrollRef: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalesPayoutBatch', salesPayoutBatchSchema);
