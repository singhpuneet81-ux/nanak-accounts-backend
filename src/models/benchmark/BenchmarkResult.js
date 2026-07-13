const mongoose = require('mongoose');

const calculatedRatioSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    clientValue: { type: Number, required: true },
    industryMin: { type: Number, required: true },
    industryAverage: { type: Number, required: true },
    industryMax: { type: Number, required: true },
    difference: { type: Number, required: true },
    status: {
      type: String,
      enum: ['within', 'slight', 'high'],
      default: 'within',
    },
    recommendation: { type: String, default: '' },
    unit: { type: String, default: '%' },
  },
  { _id: false }
);

const insightSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'success', 'warning', 'critical'], default: 'info' },
    recommendation: { type: String, default: '' },
    priority: { type: Number, default: 3 },
    expectedImpact: { type: String, default: '' },
    ratioKey: { type: String, default: '' },
  },
  { _id: false }
);

const benchmarkResultSchema = new mongoose.Schema(
  {
    client: {
      name: { type: String, required: true },
      company: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    industryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Industry', required: true },
    industryName: { type: String, required: true },
    financialYear: { type: String, required: true },
    allInputs: { type: mongoose.Schema.Types.Mixed, required: true },
    calculatedRatios: [calculatedRatioSchema],
    riskScore: { type: Number, default: 0 },
    overallStatus: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      default: 'low',
    },
    recommendations: [insightSchema],
    charts: { type: mongoose.Schema.Types.Mixed, default: {} },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'BenchmarkReport' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BenchmarkResult', benchmarkResultSchema);
