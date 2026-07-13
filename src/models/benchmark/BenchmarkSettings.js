const mongoose = require('mongoose');

const benchmarkSettingsSchema = new mongoose.Schema(
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
      moderate: { type: Number, default: 50 },
      high: { type: Number, default: 75 },
    },
    defaultFinancialYear: { type: String, default: 'FY2025' },
    autoPublishImports: { type: Boolean, default: false },
    requireVerification: { type: Boolean, default: true },
    permissions: {
      create: { type: [String], default: ['admin', 'manager'] },
      edit: { type: [String], default: ['admin', 'manager'] },
      delete: { type: [String], default: ['admin'] },
      export: { type: [String], default: ['admin', 'manager', 'staff'] },
      approve: { type: [String], default: ['admin', 'manager'] },
      publish: { type: [String], default: ['admin'] },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BenchmarkSettings', benchmarkSettingsSchema);
