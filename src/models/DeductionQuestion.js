const mongoose = require('mongoose');

const evidenceItemSchema = new mongoose.Schema(
  {
    kind: { type: String, default: 'receipt' },
    requirement: { type: String, default: 'optional' },
    label: { type: String },
  },
  { _id: false }
);

const deductionQuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    occupationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeductionOccupation',
      index: true,
    },
    occupationName: { type: String, default: '' },
    industry: { type: String, default: 'Other', index: true },
    section: { type: String, default: 'Other Expenses', index: true },
    question: { type: String, default: '' },
    questionBody: { type: String, default: '' },
    explanation: { type: String, default: '' },
    followUps: [{ type: mongoose.Schema.Types.Mixed }],
    questionType: { type: String, default: 'yes_no' },
    options: [{ type: String }],
    atoRule: { type: String, default: '' },
    atoReference: { type: String, default: '' },
    publicRuling: { type: String, default: '' },
    taxTip: { type: String, default: '' },
    warnings: [{ type: String }],
    examples: [{ type: String }],
    evidenceRequired: [{ type: String }],
    evidenceItems: [evidenceItemSchema],
    riskLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      default: 'low',
    },
    visibility: {
      type: String,
      enum: ['interview', 'training', 'both', 'internal'],
      default: 'both',
    },
    visibilityRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    priority: { type: Number, default: 50 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      default: 'medium',
    },
    version: { type: String, default: '1.0.0' },
    status: {
      type: String,
      enum: ['draft', 'pending', 'verified', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    tags: [{ type: String }],
    financialYear: { type: String, default: '2025-26', index: true },
    atoVerified: { type: Boolean, default: false },
    interviewMode: { type: Boolean, default: true },
    trainingMode: { type: Boolean, default: true },
    trainingNotes: { type: String, default: '' },
    correctAnswer: { type: String, default: '' },
    correctExplanation: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    history: [{ type: mongoose.Schema.Types.Mixed }],
  },
  { timestamps: true, collection: 'deduction_questions', strict: false }
);

deductionQuestionSchema.index({ occupationId: 1, status: 1 });
deductionQuestionSchema.index({ financialYear: 1, status: 1 });
deductionQuestionSchema.index({ section: 1, riskLevel: 1 });

module.exports =
  mongoose.models.DeductionQuestion || mongoose.model('DeductionQuestion', deductionQuestionSchema);
