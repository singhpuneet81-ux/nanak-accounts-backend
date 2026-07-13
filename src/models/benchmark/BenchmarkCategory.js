const mongoose = require('mongoose');

const benchmarkCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'Factory' },
    color: { type: String, default: '#f97316' },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    industryCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BenchmarkCategory', benchmarkCategorySchema);
