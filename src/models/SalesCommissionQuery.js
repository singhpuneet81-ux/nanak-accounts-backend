const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, default: '' },
    body: { type: String, required: true },
    at: { type: String, required: true },
  },
  { _id: false }
);

const salesCommissionQuerySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesDeal', default: null },
    clientName: { type: String, default: '' },
    status: { type: String, enum: ['Open', 'Admin responded', 'Resolved', 'Reopened'], default: 'Open' },
    messages: { type: [messageSchema], default: [] },
    unreadForAdmin: { type: Boolean, default: true },
    unreadForStaff: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalesCommissionQuery', salesCommissionQuerySchema);
