const mongoose = require('mongoose');

const deductionKnowledgeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, default: 'article', index: true },
    summary: { type: String, default: '' },
    content: { type: String, default: '' },
    markdown: { type: String, default: '' },
    atoReference: { type: String, default: '' },
    url: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    industry: { type: String, default: 'Universal', index: true },
    tags: [{ type: String }],
    financialYear: { type: String, default: '2025-26', index: true },
    status: {
      type: String,
      enum: ['draft', 'pending', 'verified', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    relatedOccupationIds: [{ type: mongoose.Schema.Types.Mixed }],
    relatedQuestionIds: [{ type: mongoose.Schema.Types.Mixed }],
    relatedRuleIds: [{ type: mongoose.Schema.Types.Mixed }],
    version: { type: String, default: '1.0.0' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    history: [{ type: mongoose.Schema.Types.Mixed }],
  },
  { timestamps: true, collection: 'deduction_knowledge', strict: false }
);

deductionKnowledgeSchema.index({ type: 1, status: 1 });
deductionKnowledgeSchema.index({ financialYear: 1, status: 1 });

module.exports =
  mongoose.models.DeductionKnowledge ||
  mongoose.model('DeductionKnowledge', deductionKnowledgeSchema);
