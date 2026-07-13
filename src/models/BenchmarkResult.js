const mongoose = require('mongoose');

const calculatedRatioSchema = new mongoose.Schema(
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

const benchmarkResultSchema = new mongoose.Schema(
  {
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'BenchmarkReport', index: true },
    clientId: { type: String, index: true },
    industryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Industry', required: true, index: true },
    industryName: { type: String },
    financialYear: { type: String, index: true },
    financialInputs: {
      revenue: { type: Number, default: 0 },
      costOfSales: { type: Number, default: 0 },
      payroll: { type: Number, default: 0 },
      rent: { type: Number, default: 0 },
      marketing: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      utilities: { type: Number, default: 0 },
      administration: { type: Number, default: 0 },
      vehicles: { type: Number, default: 0 },
      vehicleExpenses: { type: Number, default: 0 },
      depreciation: { type: Number, default: 0 },
      interest: { type: Number, default: 0 },
      inventory: { type: Number, default: 0 },
      assets: { type: Number, default: 0 },
      liabilities: { type: Number, default: 0 },
      receivables: { type: Number, default: 0 },
      accountsReceivable: { type: Number, default: 0 },
      payables: { type: Number, default: 0 },
      accountsPayable: { type: Number, default: 0 },
      cash: { type: Number, default: 0 },
      otherExpenses: { type: Number, default: 0 },
      operatingExpenses: { type: Number, default: 0 },
    },
    calculated: {
      grossMargin: Number,
      netMargin: Number,
      expenseRatio: Number,
      payrollRatio: Number,
      rentRatio: Number,
      vehicleRatio: Number,
      operatingMargin: Number,
      roa: Number,
      roe: Number,
      currentRatio: Number,
      quickRatio: Number,
      debtRatio: Number,
      inventoryTurnover: Number,
      cashRatio: Number,
      workingCapital: Number,
      riskScore: Number,
    },
    calculatedRatios: [calculatedRatioSchema],
    riskScore: { type: Number, default: 0 },
    overallStatus: { type: String, default: 'low' },
    recommendations: { type: [mongoose.Schema.Types.Mixed], default: [] },
    charts: { type: mongoose.Schema.Types.Mixed, default: {} },
    benchmarkVersion: { type: String, default: '1.0.0' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'benchmark_results' }
);

benchmarkResultSchema.index({ industryId: 1, financialYear: 1 });
benchmarkResultSchema.index({ clientId: 1, createdAt: -1 });

module.exports = mongoose.models.BenchmarkResult || mongoose.model('BenchmarkResult', benchmarkResultSchema);
