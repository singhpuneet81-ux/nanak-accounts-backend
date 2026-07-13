const mongoose = require('mongoose');

const benchmarkLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'create',
        'update',
        'delete',
        'clone',
        'publish',
        'archive',
        'verify',
        'import',
        'export',
        'calculate',
        'report',
        'settings',
      ],
    },
    entityType: {
      type: String,
      enum: ['industry', 'category', 'report', 'result', 'import', 'settings', 'version'],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityName: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, default: '' },
  },
  { timestamps: true }
);

benchmarkLogSchema.index({ createdAt: -1 });
benchmarkLogSchema.index({ action: 1, entityType: 1 });

module.exports = mongoose.model('BenchmarkLog', benchmarkLogSchema);
