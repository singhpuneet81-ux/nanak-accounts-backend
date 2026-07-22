const mongoose = require('mongoose');

const salesClientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    entity: { type: String, default: '' },
    contact: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalesClient', salesClientSchema);
