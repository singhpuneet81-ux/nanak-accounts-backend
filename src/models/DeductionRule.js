const mongoose = require('mongoose');

const evidenceItemSchema = new mongoose.Schema(
  {
    kind: { type: String, default: 'receipt' },
    requirement: { type: String, default: 'optional' },
    label: { type: String },
  },
  { _id: false }
);

const deductionRuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, default: '', index: true },
    ruleNumber: { type: String, default: '' },
    category: { type: String, default: 'General', index: true },
    industry: { type: String, default: 'Universal', index: true },
    summary: { type: String, default: '' },
    description: { type: String, default: '' },
    explanation: { type: String, default: '' },
    examples: [{ type: String }],
    exceptions: [{ type: String }],
    atoReference: { type: String, default: '' },
    publicRuling: { type: String, default: '' },
    riskLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      default: 'low',
    },
    claimable: { type: Boolean, default: true },
    evidenceRequired: [{ type: String }],
    evidenceItems: [evidenceItemSchema],
    conditions: { type: mongoose.Schema.Types.Mixed, default: {} },
    relatedQuestionIds: [{ type: mongoose.Schema.Types.Mixed }],
    relatedOccupationIds: [{ type: mongoose.Schema.Types.Mixed }],
    relatedKnowledgeIds: [{ type: mongoose.Schema.Types.Mixed }],
    financialYear: { type: String, default: '2025-26', index: true },
    version: { type: String, default: '1.0.0' },
    status: {
      type: String,
      enum: ['draft', 'pending', 'verified', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    usageCount: { type: Number, default: 0 },
    occupationIds: [{ type: mongoose.Schema.Types.Mixed }],
    tags: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    history: [{ type: mongoose.Schema.Types.Mixed }],
  },
  { timestamps: true, collection: 'deduction_rules', strict: false }
);

deductionRuleSchema.index({ financialYear: 1, status: 1 });
deductionRuleSchema.index({ category: 1, status: 1 });

module.exports =
  mongoose.models.DeductionRule || mongoose.model('DeductionRule', deductionRuleSchema);
