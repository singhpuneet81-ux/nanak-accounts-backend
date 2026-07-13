const mongoose = require('mongoose');

const benchmarkReportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    clientName: { type: String, required: true, index: true },
    company: { type: String, default: '' },
    industryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Industry', required: true },
    industryName: { type: String, required: true },
    financialYear: { type: String, required: true },
    turnover: { type: Number, default: 0 },
    riskScore: { type: Number, default: 0, index: true },
    overallStatus: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      default: 'low',
      index: true,
    },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'BenchmarkResult' },
    version: { type: String, default: '1.0.0' },
    notes: { type: String, default: '' },
    exportFormats: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, default: '' },
  },
  { timestamps: true }
);

benchmarkReportSchema.index({ clientName: 'text', company: 'text', industryName: 'text' });

module.exports = mongoose.model('BenchmarkReport', benchmarkReportSchema);
