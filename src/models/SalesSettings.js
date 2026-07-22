const mongoose = require('mongoose');

const salesSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    retentionDays: { type: Number, default: 183 },
    firstYearMonths: { type: Number, default: 12 },
    payoutFrequency: { type: String, enum: ['quarterly', 'half-yearly'], default: 'quarterly' },
    fxRate: { type: Number, default: 65 },
    reportFY: { type: String, default: '2026-27' },
    demoToday: { type: String, default: '2027-02-10' },
    exclusions: { type: [String], default: ['ASIC', 'gov', 'disbursements', 'pass-through', 'GST'] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalesSettings', salesSettingsSchema);
