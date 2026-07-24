const mongoose = require('mongoose');

const quarterSchema = new mongoose.Schema(
  {
    k: { type: String, required: true },
    l: { type: String, required: true },
    due: { type: String, required: true },
  },
  { _id: false }
);

const practiceSettingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: 'default', unique: true },
    activeFy: { type: String, default: '2025-26' },
    currentQuarter: { type: String, enum: ['q1', 'q2', 'q3', 'q4'], default: 'q4' },
    quarters: {
      type: [quarterSchema],
      default: () => [
        { k: 'q1', l: 'Sep 25', due: '28 Oct 2025' },
        { k: 'q2', l: 'Dec 25', due: '28 Feb 2026' },
        { k: 'q3', l: 'Mar 26', due: '28 Apr 2026' },
        { k: 'q4', l: 'Jun 26', due: '28 Jul 2026' },
      ],
    },
    // Legacy — no longer used in CM v4 UI (office removed). Kept so old docs still load.
    offices: { type: [String], default: () => [] },
    reminderTemplate: {
      type: String,
      default:
        'Hi {name}, a friendly reminder from Nanak Accountants: your BAS for the {quarter} quarter is now due. Please send through your documents so we can lodge on time. Reply here or call your client manager.',
    },
    onTimeThreshold: { type: Number, default: 85 },
    payrollRate: { type: Number, default: 25 },
    feeReviewMonths: { type: Number, default: 24 },
    todayOverride: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PracticeSettings', practiceSettingsSchema);
