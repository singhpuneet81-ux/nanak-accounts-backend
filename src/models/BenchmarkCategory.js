const mongoose = require('mongoose');

const benchmarkCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    icon: { type: String, default: 'Factory' },
    description: { type: String, default: '' },
    color: { type: String, default: '#f97316' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    sortOrder: { type: Number, default: 0 },
    industryCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'benchmark_categories' }
);

module.exports = mongoose.models.BenchmarkCategory || mongoose.model('BenchmarkCategory', benchmarkCategorySchema);
