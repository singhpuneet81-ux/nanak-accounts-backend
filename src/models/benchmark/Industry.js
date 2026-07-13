const mongoose = require('mongoose');

const ratioSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true },
    min: { type: Number, required: true },
    average: { type: Number, required: true },
    max: { type: Number, required: true },
    unit: { type: String, default: '%' },
    description: { type: String, default: '' },
    recommendation: { type: String, default: '' },
    weight: { type: Number, default: 1 },
    higherIsBetter: { type: Boolean, default: true },
  },
  { _id: false }
);

const turnoverBandSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    minTurnover: { type: Number, default: 0 },
    maxTurnover: { type: Number, default: null },
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
    description: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'BenchmarkCategory' },
    verified: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    primaryRatio: { type: String, default: 'gross_margin' },
    primaryBenchmark: { type: String, default: '' },
    atoReference: { type: String, default: '' },
    riskNotes: { type: String, default: '' },
    averageMargin: { type: Number, default: 0 },
    tags: [{ type: String }],
    ratios: [ratioSchema],
    turnoverBands: [turnoverBandSchema],
    documents: [documentSchema],
    version: { type: String, default: '1.0.0' },
    versionNumber: { type: Number, default: 1 },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    publishedAt: { type: Date },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

industrySchema.index({ name: 'text', description: 'text', tags: 'text' });
industrySchema.index({ category: 1, verified: 1, status: 1 });

module.exports = mongoose.model('Industry', industrySchema);
