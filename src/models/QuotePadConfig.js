const mongoose = require('mongoose');

// Singleton document holding the editable pricing configuration
// for the Quote Pad module (household + business entity engines).
const quotePadConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    firm: { type: Object, default: {} },
    household: { type: Object, default: {} },
    business: { type: Object, default: {} },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model('QuotePadConfig', quotePadConfigSchema);
