/**
 * Excel / CSV importer — ExcelJS preferred, XLSX fallback
 */

const { slugify } = require('./benchmarkHelpers');

const ALIASES = {
  name: ['name', 'industry', 'industry name', 'industry_name'],
  category: ['category', 'industry category', 'sector', 'categoryname'],
  description: ['description', 'desc', 'details'],
  primaryRatio: ['primaryratio', 'primary_ratio', 'primary'],
  verified: ['verified', 'is_verified'],
  status: ['status'],
  tags: ['tags', 'tag'],
  atratio: ['ato', 'ato reference', 'atoreference'],
};

function mapColumns(headers = []) {
  const columnMap = {};
  for (const [field, keys] of Object.entries(ALIASES)) {
    const found = headers.find((h) => keys.includes(String(h).toLowerCase().trim()));
    if (found) columnMap[field] = found;
  }
  return columnMap;
}

function rowToObject(rowValues, headers) {
  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = rowValues[i] ?? '';
  });
  return obj;
}

async function parseWithExcelJS(buffer, fileName) {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { headers: [], rows: [], fileType: 'xlsx' };

  const headers = [];
  sheet.getRow(1).eachCell((cell, col) => {
    headers[col - 1] = String(cell.value ?? '').trim();
  });

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = headers.map((_, i) => {
      const cell = row.getCell(i + 1).value;
      if (cell && typeof cell === 'object' && cell.text) return cell.text;
      return cell ?? '';
    });
    rows.push(rowToObject(values, headers));
  });

  return {
    headers: headers.filter(Boolean),
    rows,
    fileType: String(fileName).toLowerCase().endsWith('.xls') ? 'xls' : 'xlsx',
  };
}

function parseWithXlsx(buffer, fileName) {
  const XLSX = require('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return {
    headers,
    rows,
    fileType: String(fileName).toLowerCase().endsWith('.csv')
      ? 'csv'
      : String(fileName).toLowerCase().endsWith('.xls')
        ? 'xls'
        : 'xlsx',
  };
}

function parseCsv(buffer) {
  const text = buffer.toString('utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [], fileType: 'csv' };
  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
  const rows = lines.slice(1).map((line) => {
    const cols = line.match(/("([^"]|"")*"|[^,]*)/g) || [];
    const values = cols.map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
    return rowToObject(values, headers);
  });
  return { headers, rows, fileType: 'csv' };
}

async function parseWorkbookBuffer(buffer, fileName = 'upload.xlsx') {
  const lower = String(fileName).toLowerCase();
  if (lower.endsWith('.csv')) return parseCsv(buffer);

  try {
    require.resolve('exceljs');
    return await parseWithExcelJS(buffer, fileName);
  } catch (_) {
    return parseWithXlsx(buffer, fileName);
  }
}

function validateImportRows(rows, columnMap) {
  const preview = [];
  const errors = [];
  let validRows = 0;

  rows.forEach((row, idx) => {
    const mapped = {
      name: String(row[columnMap.name] || '').trim(),
      category: String(row[columnMap.category] || 'Other').trim() || 'Other',
      description: String(row[columnMap.description] || '').trim(),
      primaryRatio: String(row[columnMap.primaryRatio] || 'gross_margin').trim(),
      verified: String(row[columnMap.verified] || '').toLowerCase() === 'true',
      status: String(row[columnMap.status] || 'pending').trim() || 'pending',
      tags: String(row[columnMap.tags] || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      atoReference: String(row[columnMap.atratio] || '').trim(),
    };

    if (!mapped.name) {
      errors.push({ row: idx + 2, field: 'name', message: 'Name is required' });
    } else {
      validRows += 1;
    }
    preview.push(mapped);
  });

  return { preview, errors, validRows, invalidRows: rows.length - validRows };
}

function detectDuplicates(preview, existingNames = new Set()) {
  const seen = new Set();
  let duplicateCount = 0;
  const annotated = preview.map((row) => {
    const key = slugify(row.name);
    const isDuplicate = existingNames.has(key) || seen.has(key);
    if (isDuplicate) duplicateCount += 1;
    seen.add(key);
    return { ...row, isDuplicate, slug: key };
  });
  return { annotated, duplicateCount };
}

module.exports = {
  parseWorkbookBuffer,
  mapColumns,
  validateImportRows,
  detectDuplicates,
};
