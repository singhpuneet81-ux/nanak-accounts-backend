const mongoose = require('mongoose');

// Saved history for internal staff tools (ATO Benchmark Checker, Deduction Intelligence).
// `payload` holds the full tool state so a session can be reloaded; `summary` holds
// lightweight display fields for list views.
const toolSessionSchema = new mongoose.Schema(
  {
    tool: {
      type: String,
      enum: ['ato-benchmark', 'deduction'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    summary: { type: mongoose.Schema.Types.Mixed, default: {} },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    createdByName: { type: String, default: '' },
  },
  { timestamps: true }
);

toolSessionSchema.index({ tool: 1, createdAt: -1 });

module.exports = mongoose.model('ToolSession', toolSessionSchema);
