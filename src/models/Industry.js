const mongoose = require('mongoose');

const ratioSchema = new mongoose.Schema(
  {
    ratioName: { type: String, required: true },
    ratioKey: { type: String, required: true },
    minimum: { type: Number, required: true },
    average: { type: Number, required: true },
    maximum: { type: Number, required: true },
    description: { type: String, default: '' },
    recommendation: { type: String, default: '' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    unit: { type: String, default: '%' },
    formula: { type: String, default: '' },
    weight: { type: Number, default: 1 },
    higherIsBetter: { type: Boolean, default: true },
  },
  { _id: false }
);

const turnoverBandSchema = new mongoose.Schema(
  {
    label: { type: String, default: '' },
    minimumTurnover: { type: Number, default: 0 },
    maximumTurnover: { type: Number, default: null },
    ratios: [ratioSchema],
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, default: 'pdf' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const industrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'BenchmarkCategory', index: true },
    category: { type: String, index: true },
    description: { type: String, default: '' },
    verified: { type: Boolean, default: false, index: true },
    verificationDate: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    primaryRatio: { type: String, default: 'gross_margin' },
    primaryBenchmark: { type: String, default: '' },
    atoReference: { type: String, default: '' },
    version: { type: String, default: '1.0.0' },
    versionNumber: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    riskNotes: { type: String, default: '' },
    documents: [documentSchema],
    turnoverBands: [turnoverBandSchema],
    ratios: [ratioSchema],
    tags: [{ type: String }],
    averageMargin: { type: Number, default: 0 },
    usageCount: { type: Number, default: 0 },
    publishedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'industries' }
);

industrySchema.index({ name: 'text', description: 'text', tags: 'text' });
industrySchema.index({ categoryId: 1, verified: 1, status: 1 });
industrySchema.index({ category: 1, status: 1 });

module.exports = mongoose.models.Industry || mongoose.model('Industry', industrySchema);
