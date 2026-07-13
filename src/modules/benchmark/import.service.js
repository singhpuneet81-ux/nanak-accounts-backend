const Industry = require('../../models/Industry');
const BenchmarkCategory = require('../../models/BenchmarkCategory');
const BenchmarkImport = require('../../models/BenchmarkImport');
const {
  parseWorkbookBuffer,
  mapColumns,
  validateImportRows,
  detectDuplicates,
} = require('../../utils/benchmarkExcelImporter');
const { slugify, writeBenchmarkLog, paginate, cacheClear } = require('../../utils/benchmarkHelpers');

async function previewImport(file, user) {
  if (!file?.buffer) {
    const err = new Error('File required');
    err.statusCode = 400;
    throw err;
  }

  const parsed = await parseWorkbookBuffer(file.buffer, file.originalname);
  const columnMap = mapColumns(parsed.headers);
  const { preview, errors, validRows, invalidRows } = validateImportRows(parsed.rows, columnMap);

  const existing = await Industry.find({ status: { $ne: 'archived' } }).select('slug name').lean();
  const existingNames = new Set(existing.map((i) => i.slug || slugify(i.name)));
  const { annotated, duplicateCount } = detectDuplicates(preview, existingNames);

  const imp = await BenchmarkImport.create({
    fileName: file.originalname,
    fileType: parsed.fileType,
    status: 'preview',
    totalRows: parsed.rows.length,
    validRows,
    invalidRows,
    duplicateCount,
    columnMap,
    preview: annotated.slice(0, 100),
    rowErrors: errors,
    createdBy: user._id,
  });

  return {
    import: imp,
    columns: parsed.headers,
    columnMap,
    preview: annotated.slice(0, 50),
    errors,
  };
}

async function confirmImport(importId, rows, user) {
  const imp = await BenchmarkImport.findById(importId);
  if (!imp) {
    const err = new Error('Import not found');
    err.statusCode = 404;
    throw err;
  }

  const sourceRows = rows || imp.preview || [];
  let importedCount = 0;
  const errors = [];
  const categories = await BenchmarkCategory.find({ status: 'active' }).lean();
  const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

  for (let i = 0; i < sourceRows.length; i++) {
    const row = sourceRows[i];
    if (!row.name || row.isDuplicate) {
      if (!row.name) errors.push({ row: i + 1, field: 'name', message: 'Missing name' });
      continue;
    }
    try {
      let cat = catByName.get(String(row.category || 'Other').toLowerCase());
      if (!cat) {
        cat = await BenchmarkCategory.create({
          name: row.category || 'Other',
          slug: slugify(`${row.category || 'other'}-${Date.now()}`),
          createdBy: user._id,
        });
        catByName.set(cat.name.toLowerCase(), cat);
      }

      await Industry.create({
        name: row.name,
        slug: slugify(`${row.name}-${Date.now()}-${i}`),
        description: row.description || '',
        category: cat.name,
        categoryId: cat._id,
        status: row.status === 'published' ? 'published' : 'pending',
        verified: !!row.verified,
        verificationDate: row.verified ? new Date() : undefined,
        primaryRatio: row.primaryRatio || 'gross_margin',
        atoReference: row.atoReference || '',
        tags: row.tags || [],
        ratios: [],
        createdBy: user._id,
        updatedBy: user._id,
      });
      importedCount += 1;
    } catch (err) {
      errors.push({ row: i + 1, field: 'general', message: err.message });
    }
  }

  imp.status = errors.length && importedCount ? 'partial' : errors.length ? 'failed' : 'completed';
  imp.importedCount = importedCount;
  imp.rowErrors = errors;
  await imp.save();
  cacheClear('benchmark:');

  await writeBenchmarkLog({
    action: 'imported',
    entityType: 'import',
    entityId: imp._id,
    entityName: imp.fileName,
    details: { importedCount, errors: errors.length },
    user,
  });

  return { import: imp, importedCount, errors };
}

async function importHistory(query) {
  const { page, limit, skip } = paginate(query);
  const [imports, total] = await Promise.all([
    BenchmarkImport.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    BenchmarkImport.countDocuments(),
  ]);
  return {
    imports,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

module.exports = {
  previewImport,
  confirmImport,
  importHistory,
};
