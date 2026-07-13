const mongoose = require('mongoose');

const comparedRatioSchema = new mongoose.Schema(
  {
    ratioKey: String,
    ratioName: String,
    clientValue: Number,
    industryMin: Number,
    industryAverage: Number,
    industryMax: Number,
    difference: Number,
    status: { type: String, enum: ['within', 'slight', 'high'], default: 'within' },
    recommendation: String,
    unit: { type: String, default: '%' },
    weight: Number,
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    message: String,
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical', 'info', 'success', 'warning'], default: 'medium' },
    recommendation: String,
    priority: Number,
    expectedImpact: String,
    ratioKey: String,
  },
  { _id: false }
);

const benchmarkReportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    clientId: { type: String, index: true },
    clientName: { type: String, required: true, index: true },
    company: { type: String, default: '' },
    industryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Industry', required: true, index: true },
    industryName: { type: String, required: true },
    financialYear: { type: String, required: true, index: true },
    clientInformation: {
      name: String,
      company: String,
      email: String,
      phone: String,
      turnover: Number,
      notes: String,
    },
    financialInputs: { type: mongoose.Schema.Types.Mixed, default: {} },
    calculatedRatios: [comparedRatioSchema],
    riskScore: { type: Number, default: 0, index: true },
    overallStatus: {
      type: String,
      enum: ['low', 'medium', 'moderate', 'high', 'critical'],
      default: 'low',
      index: true,
    },
    recommendations: [recommendationSchema],
    charts: { type: mongoose.Schema.Types.Mixed, default: {} },
    notes: { type: String, default: '' },
    version: { type: String, default: '1.0.0' },
    benchmarkVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'BenchmarkVersion' },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'BenchmarkResult' },
    turnover: { type: Number, default: 0 },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    generatedByName: { type: String, default: '' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'final', 'approved', 'archived'],
      default: 'final',
      index: true,
    },
  },
  { timestamps: true, collection: 'benchmark_reports' }
);

benchmarkReportSchema.index({ clientName: 1, financialYear: 1 });
benchmarkReportSchema.index({ industryId: 1, createdAt: -1 });

module.exports = mongoose.models.BenchmarkReport || mongoose.model('BenchmarkReport', benchmarkReportSchema);
