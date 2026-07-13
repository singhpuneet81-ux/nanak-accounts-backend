const mongoose = require('mongoose');

const deductionSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    defaultFinancialYear: { type: String, default: '2025-26' },
    defaultMode: { type: String, enum: ['interview', 'training'], default: 'interview' },
    autoSaveDrafts: { type: Boolean, default: true },
    requireEvidenceOnHighRisk: { type: Boolean, default: true },
    showAtoReferences: { type: Boolean, default: true },
    partnerVerificationRequired: { type: Boolean, default: true },
    managerApprovalThreshold: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      default: 'high',
    },
    exportFormats: { type: [String], default: ['PDF', 'JSON', 'CSV'] },
    notificationEmail: { type: String, default: 'deductions@nanakaccounts.com.au' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'deduction_settings', strict: false }
);

module.exports =
  mongoose.models.DeductionSettings || mongoose.model('DeductionSettings', deductionSettingsSchema);
