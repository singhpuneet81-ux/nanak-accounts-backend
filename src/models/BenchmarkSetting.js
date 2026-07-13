const mongoose = require('mongoose');

const benchmarkSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    branding: {
      companyName: { type: String, default: 'Nanak Accountants' },
      logoUrl: { type: String, default: '' },
      primaryColor: { type: String, default: '#f97316' },
      footerText: { type: String, default: 'Confidential – Prepared by Nanak Accountants' },
      reportTitle: { type: String, default: 'Industry Benchmark Intelligence Report' },
    },
    riskThresholds: {
      low: { type: Number, default: 25 },
      medium: { type: Number, default: 50 },
      high: { type: Number, default: 75 },
    },
    defaultFinancialYear: { type: String, default: 'FY2025' },
    autoPublishImports: { type: Boolean, default: false },
    requireVerification: { type: Boolean, default: true },
    cacheTtlSeconds: { type: Number, default: 120 },
    permissions: {
      create: { type: [String], default: ['admin', 'manager'] },
      update: { type: [String], default: ['admin', 'manager'] },
      delete: { type: [String], default: ['admin'] },
      approve: { type: [String], default: ['admin', 'manager'] },
      export: { type: [String], default: ['admin', 'manager', 'staff'] },
      import: { type: [String], default: ['admin', 'manager'] },
      publish: { type: [String], default: ['admin'] },
      view: { type: [String], default: ['admin', 'manager', 'staff'] },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'benchmark_settings' }
);

module.exports = mongoose.models.BenchmarkSetting || mongoose.model('BenchmarkSetting', benchmarkSettingSchema);
