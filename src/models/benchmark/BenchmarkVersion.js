const mongoose = require('mongoose');

const benchmarkVersionSchema = new mongoose.Schema(
  {
    industryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Industry',
      required: true,
      index: true,
    },
    version: { type: String, required: true },
    versionNumber: { type: Number, required: true },
    previousVersion: { type: String, default: null },
    reason: { type: String, default: '' },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

benchmarkVersionSchema.index({ industryId: 1, versionNumber: -1 });

module.exports = mongoose.model('BenchmarkVersion', benchmarkVersionSchema);
