const mongoose = require('mongoose');

const deductionEngineRuleSchema = new mongoose.Schema(
  {
    ruleNumber: { type: String, default: '', index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, default: 'optional', index: true },
    priority: { type: Number, default: 50 },
    enabled: { type: Boolean, default: true },
    atoReference: { type: String, default: '' },
    publicRuling: { type: String, default: '' },
    financialYear: { type: String, default: '2025-26', index: true },
    effectiveDate: { type: Date },
    expiryDate: { type: Date },
    version: { type: String, default: '1.0.0' },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived', 'pending'],
      default: 'draft',
      index: true,
    },
    tags: [{ type: String }],
    conditionTree: { type: mongoose.Schema.Types.Mixed, default: {} },
    actions: [{ type: mongoose.Schema.Types.Mixed }],
    dependencies: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.Mixed },
    updatedBy: { type: mongoose.Schema.Types.Mixed },
    changeLog: [{ type: String }],
    reason: { type: String, default: '' },
  },
  { timestamps: true, collection: 'deduction_engine_rules', strict: false }
);

deductionEngineRuleSchema.index({ type: 1, status: 1 });
deductionEngineRuleSchema.index({ enabled: 1, priority: -1 });

module.exports =
  mongoose.models.DeductionEngineRule ||
  mongoose.model('DeductionEngineRule', deductionEngineRuleSchema);
