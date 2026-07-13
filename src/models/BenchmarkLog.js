const mongoose = require('mongoose');

const benchmarkLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'created',
        'updated',
        'deleted',
        'imported',
        'exported',
        'calculated',
        'downloaded',
        'approved',
        'published',
        'cloned',
        'verified',
        'settings',
      ],
      index: true,
    },
    entityType: {
      type: String,
      enum: ['industry', 'category', 'report', 'result', 'import', 'settings', 'version'],
      required: true,
      index: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
    entityName: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, default: '' },
  },
  { timestamps: true, collection: 'benchmark_logs' }
);

benchmarkLogSchema.index({ createdAt: -1 });

module.exports = mongoose.models.BenchmarkLog || mongoose.model('BenchmarkLog', benchmarkLogSchema);
