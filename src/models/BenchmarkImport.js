const mongoose = require('mongoose');

const benchmarkImportSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ['xlsx', 'xls', 'csv'], default: 'xlsx' },
    status: {
      type: String,
      enum: ['pending', 'preview', 'processing', 'completed', 'failed', 'partial'],
      default: 'pending',
      index: true,
    },
    totalRows: { type: Number, default: 0 },
    validRows: { type: Number, default: 0 },
    invalidRows: { type: Number, default: 0 },
    importedCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    columnMap: { type: mongoose.Schema.Types.Mixed, default: {} },
    preview: { type: [mongoose.Schema.Types.Mixed], default: [] },
    rowErrors: [
      {
        row: Number,
        field: String,
        message: String,
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'benchmark_imports' }
);

module.exports = mongoose.models.BenchmarkImport || mongoose.model('BenchmarkImport', benchmarkImportSchema);
