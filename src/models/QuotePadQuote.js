const mongoose = require('mongoose');

// A saved quote created in the Quote Pad (household or business entity).
const quotePadQuoteSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, index: true },
    kind: { type: String, enum: ['household', 'entity'], required: true },
    label: { type: String, default: '' },
    structure: { type: String, default: 'household' },
    title: { type: String, default: '' },
    total: { type: Number, default: 0 },
    data: { type: Object, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdByName: { type: String, default: '' },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model('QuotePadQuote', quotePadQuoteSchema);
