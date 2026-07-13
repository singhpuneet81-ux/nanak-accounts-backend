const { asyncHandler } = require('../../middleware/asyncHandler');
const industryService = require('./industry.service');
const reportService = require('./report.service');
const analyticsService = require('./analytics.service');
const importService = require('./import.service');
const benchmarkService = require('./benchmark.service');
const { runCalculation } = require('./benchmark.service');
const { writeBenchmarkLog, paginate } = require('../../utils/benchmarkHelpers');
const XLSX = require('xlsx');
const Industry = require('../../models/Industry');

// ── Categories ──────────────────────────────────────────
const listCategories = asyncHandler(async (_req, res) => {
  const categories = await industryService.listCategories();
  res.json({ success: true, categories });
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await industryService.getCategory(req.params.id);
  res.json({ success: true, category });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await industryService.createCategory(req.body, req.user);
  res.status(201).json({ success: true, category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await industryService.updateCategory(req.params.id, req.body);
  res.json({ success: true, category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await industryService.deleteCategory(req.params.id, req.user);
  res.json({ success: true, message: 'Category archived' });
});

// ── Calculator ──────────────────────────────────────────
const calculate = asyncHandler(async (req, res) => {
  const industryId = req.body.industryId;
  const financialInputs = req.body.financialInputs || req.body.inputs || {};
  const clientInformation = req.body.clientInformation || req.body.client || {};
  const financialYear = req.body.financialYear;
  const save = req.body.save !== false && req.body.save !== 'preview';

  if (req.path.includes('preview') || req.body.save === false) {
    const { calculation } = await runCalculation({
      industryId,
      financialInputs,
      financialYear,
      clientInformation,
      user: req.user,
      save: false,
    });
    return res.json({ success: true, calculation });
  }

  const result = await reportService.createReportFromCalculation({
    industryId,
    financialYear,
    clientInformation,
    financialInputs,
    notes: req.body.notes,
    user: req.user,
    save,
  });
  res.json({ success: true, ...result });
});

const previewCalculate = asyncHandler(async (req, res) => {
  const { calculation } = await runCalculation({
    industryId: req.body.industryId,
    financialInputs: req.body.financialInputs || req.body.inputs || {},
    financialYear: req.body.financialYear,
    clientInformation: req.body.clientInformation || req.body.client || {},
    user: req.user,
    save: false,
  });
  res.json({ success: true, calculation });
});

// ── Versions ────────────────────────────────────────────
const listAllVersions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const data = await benchmarkService.listVersions({
    industryId: req.query.industryId,
    page,
    limit,
    skip,
  });
  res.json({
    success: true,
    versions: data.versions,
    pagination: { page, limit, total: data.total, totalPages: Math.ceil(data.total / limit) || 1 },
  });
});

const createVersion = asyncHandler(async (req, res) => {
  const industry = await Industry.findById(req.body.industryId);
  if (!industry) return res.status(404).json({ success: false, message: 'Industry not found' });
  const version = await benchmarkService.createVersionSnapshot(industry, {
    reason: req.body.reason || 'Manual version',
    user: req.user,
    previousVersion: industry.version,
  });
  res.status(201).json({ success: true, version });
});

const updateVersion = asyncHandler(async (req, res) => {
  const BenchmarkVersion = require('../../models/BenchmarkVersion');
  const version = await BenchmarkVersion.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!version) return res.status(404).json({ success: false, message: 'Version not found' });
  res.json({ success: true, version });
});

const versionHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const data = await benchmarkService.listVersions({
    industryId: req.query.industryId || req.params.industryId,
    page,
    limit,
    skip,
  });
  res.json({ success: true, versions: data.versions, total: data.total });
});

// ── Settings ────────────────────────────────────────────
const getSettings = asyncHandler(async (_req, res) => {
  const settings = await benchmarkService.getOrCreateSettings();
  res.json({ success: true, settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await benchmarkService.updateSettings(req.body, req.user);
  res.json({ success: true, settings });
});

// ── Export industries (xlsx) ────────────────────────────
const exportIndustries = asyncHandler(async (req, res) => {
  const industries = await Industry.find({ status: { $ne: 'archived' } }).lean();
  const rows = industries.map((i) => ({
    Name: i.name,
    Category: i.category,
    Description: i.description,
    Verified: i.verified,
    Status: i.status,
    Version: i.version,
    AverageMargin: i.averageMargin,
    RatioCount: i.ratios?.length || 0,
    PrimaryBenchmark: i.primaryBenchmark,
    UpdatedAt: i.updatedAt,
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Industries');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  await writeBenchmarkLog({
    action: 'exported',
    entityType: 'industry',
    entityName: 'bulk-export',
    details: { count: rows.length },
    user: req.user,
  });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=benchmark-industries.xlsx');
  res.send(buf);
});

const downloadReportPdf = asyncHandler(async (req, res) => {
  const { report, result } = await reportService.getReport(req.params.id);
  const buf = await benchmarkService.buildPdfBuffer(report, result);
  await writeBenchmarkLog({
    action: 'downloaded',
    entityType: 'report',
    entityId: report._id,
    entityName: report.title,
    user: req.user,
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${report.clientName}-benchmark.pdf"`);
  res.send(buf);
});

const listLogs = asyncHandler(async (req, res) => {
  const BenchmarkLog = require('../../models/BenchmarkLog');
  const { page, limit, skip } = paginate(req.query);
  const [logs, total] = await Promise.all([
    BenchmarkLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    BenchmarkLog.countDocuments(),
  ]);
  res.json({
    success: true,
    logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  calculate,
  previewCalculate,
  listAllVersions,
  createVersion,
  updateVersion,
  versionHistory,
  getSettings,
  updateSettings,
  exportIndustries,
  downloadReportPdf,
  listLogs,
};
