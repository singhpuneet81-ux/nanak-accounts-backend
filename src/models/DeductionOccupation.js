const mongoose = require('mongoose');

const deductionOccupationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    industry: { type: String, default: 'Other', index: true },
    description: { type: String, default: '' },
    tags: [{ type: String }],
    questionCount: { type: Number, default: 0 },
    ruleCount: { type: Number, default: 0 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'verified', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    verified: { type: Boolean, default: false },
    atoVerified: { type: Boolean, default: false },
    interviewReady: { type: Boolean, default: false },
    trainingReady: { type: Boolean, default: false },
    version: { type: String, default: '1.0.0' },
    versionNumber: { type: Number, default: 1 },
    financialYear: { type: String, default: '2025-26', index: true },
    atoStatus: { type: String, default: 'pending' },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    publishedAt: { type: Date },
    history: [{ type: mongoose.Schema.Types.Mixed }],
  },
  { timestamps: true, collection: 'deduction_occupations', strict: false }
);

deductionOccupationSchema.index({ industry: 1, status: 1 });
deductionOccupationSchema.index({ financialYear: 1, status: 1 });

module.exports =
  mongoose.models.DeductionOccupation ||
  mongoose.model('DeductionOccupation', deductionOccupationSchema);
