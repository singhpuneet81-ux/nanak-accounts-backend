const mongoose = require('mongoose');

const salesAuditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: 'system' },
    action: { type: String, required: true },
    entity: { type: String, default: '' },
    detail: { type: String, default: '' },
    ts: { type: String, required: true },
  },
  { timestamps: true }
);

salesAuditLogSchema.index({ ts: -1 });

module.exports = mongoose.model('SalesAuditLog', salesAuditLogSchema);
