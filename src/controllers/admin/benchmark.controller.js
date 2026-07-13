const Industry = require('../../models/benchmark/Industry');
const BenchmarkCategory = require('../../models/benchmark/BenchmarkCategory');
const BenchmarkVersion = require('../../models/benchmark/BenchmarkVersion');
const BenchmarkReport = require('../../models/benchmark/BenchmarkReport');
const BenchmarkResult = require('../../models/benchmark/BenchmarkResult');
const Settings = require('../../models/benchmark/BenchmarkSettings');
const BenchmarkImport = require('../../models/benchmark/BenchmarkImport');
const BenchmarkLog = require('../../models/benchmark/BenchmarkLog');
const { asyncHandler } = require('../../middleware/asyncHandler');
const {
  calculateFinancialRatios,
  compareToIndustry,
  computeRiskScore,
  generateInsights,
  buildChartPayload,
  slugify,
} = require('../../services/benchmarkEngine');

async function writeLog({ action, entityType, entityId, entityName, details, user }) {
  try {
    await BenchmarkLog.create({
      action,
      entityType,
      entityId,
      entityName,
      details,
      createdBy: user?._id,
      createdByName: user?.name || '',
    });
  } catch (_) {
    /* non-blocking */
  }
}

function paginate(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// ─── Dashboard ───────────────────────────────────────────
const getDashboard = asyncHandler(async (_req, res) => {
  const [
    totalIndustries,
    verifiedBenchmarks,
    pendingVerification,
    savedReports,
    clientsAgg,
    avgScoreAgg,
    highRiskClients,
    recentReports,
    monthlyReports,
    industryDistribution,
    riskDistribution,
    mostUsed,
  ] = await Promise.all([
    Industry.countDocuments({ status: { $ne: 'archived' } }),
    Industry.countDocuments({ verified: true, status: { $ne: 'archived' } }),
    Industry.countDocuments({ status: 'pending' }),
    BenchmarkReport.countDocuments(),
    BenchmarkResult.aggregate([
      { $group: { _id: '$client.name' } },
      { $count: 'count' },
    ]),
    BenchmarkResult.aggregate([
      { $group: { _id: null, avg: { $avg: '$riskScore' } } },
    ]),
    BenchmarkReport.countDocuments({ overallStatus: { $in: ['high', 'critical'] } }),
    BenchmarkReport.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('title clientName company industryName financialYear riskScore overallStatus createdAt createdByName')
      .lean(),
    BenchmarkReport.aggregate([
      {
        $group: {
          _id: {
            y: { $year: '$createdAt' },
            m: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          avgRisk: { $avg: '$riskScore' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
      { $limit: 12 },
    ]),
    Industry.aggregate([
      { $match: { status: { $ne: 'archived' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    BenchmarkReport.aggregate([
      { $group: { _id: '$overallStatus', count: { $sum: 1 } } },
    ]),
    Industry.find({ status: 'published' })
      .sort({ usageCount: -1 })
      .limit(8)
      .select('name category usageCount averageMargin verified')
      .lean(),
  ]);

  const clientsChecked = clientsAgg?.[0]?.count || 0;
  const averageScore = Math.round(avgScoreAgg?.[0]?.avg || 0);

  const successTotal = await BenchmarkResult.countDocuments();
  const successLow = await BenchmarkResult.countDocuments({ overallStatus: { $in: ['low', 'moderate'] } });
  const benchmarkSuccessPct = successTotal ? Math.round((successLow / successTotal) * 100) : 0;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthly = monthlyReports.map((r) => ({
    month: `${months[(r._id.m || 1) - 1]} ${r._id.y}`,
    reports: r.count,
    avgRisk: Math.round(r.avgRisk || 0),
  }));

  res.json({
    success: true,
    stats: {
      totalIndustries,
      verifiedBenchmarks,
      pendingVerification,
      savedReports,
      clientsChecked,
      averageScore,
      highRiskClients,
      benchmarkSuccessPct,
    },
    recentReports,
    charts: {
      monthlyReports: monthly,
      industryDistribution: industryDistribution.map((d) => ({ name: d._id, value: d.count })),
      riskDistribution: riskDistribution.map((d) => ({
        name: d._id,
        value: d.count,
      })),
      mostUsedIndustries: mostUsed.map((i) => ({
        name: i.name,
        usage: i.usageCount,
        category: i.category,
        margin: i.averageMargin,
      })),
      averageClientPosition: averageScore,
    },
  });
});

// ─── Categories ──────────────────────────────────────────
const listCategories = asyncHandler(async (req, res) => {
  const cats = await BenchmarkCategory.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
  res.json({ success: true, categories: cats });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, color } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  const slug = slugify(name);
  const existing = await BenchmarkCategory.findOne({ slug });
  if (existing) return res.status(409).json({ success: false, message: 'Category already exists' });

  const cat = await BenchmarkCategory.create({
    name,
    slug,
    description,
    icon,
    color,
    createdBy: req.user._id,
  });
  await writeLog({
    action: 'create',
    entityType: 'category',
    entityId: cat._id,
    entityName: cat.name,
    user: req.user,
  });
  res.status(201).json({ success: true, category: cat });
});

const updateCategory = asyncHandler(async (req, res) => {
  const cat = await BenchmarkCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, category: cat });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await BenchmarkCategory.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true }
  );
  if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, message: 'Category archived' });
});

// ─── Industries ──────────────────────────────────────────
const listIndustries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const {
    search,
    category,
    status,
    verified,
    sort = 'name',
    filter,
  } = req.query;

  const q = {};
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    q.$or = [{ name: rx }, { description: rx }, { category: rx }, { tags: rx }, { primaryBenchmark: rx }];
  }
  if (category && category !== 'all') q.category = category;
  if (status && status !== 'all') q.status = status;
  if (verified === 'true') q.verified = true;
  if (verified === 'false') q.verified = false;

  if (filter === 'verified') q.verified = true;
  if (filter === 'pending') q.status = 'pending';
  if (filter === 'recent') {
    q.updatedAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }
  if (!q.status) q.status = { $ne: 'archived' };

  let sortOpt = { name: 1 };
  if (sort === 'newest') sortOpt = { updatedAt: -1 };
  if (sort === 'alphabetical') sortOpt = { name: 1 };
  if (sort === 'category') sortOpt = { category: 1, name: 1 };
  if (sort === 'usage') sortOpt = { usageCount: -1 };

  const [industries, total] = await Promise.all([
    Industry.find(q)
      .sort(sortOpt)
      .skip(skip)
      .limit(limit)
      .populate('verifiedBy', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .lean(),
    Industry.countDocuments(q),
  ]);

  const enriched = industries.map((i) => ({
    ...i,
    ratioCount: i.ratios?.length || 0,
    verifiedByName: i.verifiedBy?.name || null,
  }));

  res.json({
    success: true,
    industries: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

const getIndustry = asyncHandler(async (req, res) => {
  const industry = await Industry.findById(req.params.id)
    .populate('verifiedBy', 'name email')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .lean();
  if (!industry) return res.status(404).json({ success: false, message: 'Industry not found' });

  const versions = await BenchmarkVersion.find({ industryId: industry._id })
    .sort({ versionNumber: -1 })
    .limit(20)
    .populate('createdBy', 'name')
    .lean();

  res.json({ success: true, industry, versions });
});

const createIndustry = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  data.slug = data.slug || slugify(data.name);
  data.createdBy = req.user._id;
  data.updatedBy = req.user._id;

  if (data.ratios?.[0]) {
    const primary = data.ratios.find((r) => r.key === data.primaryRatio) || data.ratios[0];
    data.averageMargin = primary?.average || 0;
    data.primaryBenchmark = `${primary?.name || 'Primary'}: ${primary?.average}${primary?.unit || '%'}`;
  }

  const existing = await Industry.findOne({ slug: data.slug });
  if (existing) return res.status(409).json({ success: false, message: 'Industry slug already exists' });

  const industry = await Industry.create(data);

  await BenchmarkVersion.create({
    industryId: industry._id,
    version: industry.version,
    versionNumber: industry.versionNumber,
    reason: 'Initial creation',
    snapshot: industry.toObject(),
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await writeLog({
    action: 'create',
    entityType: 'industry',
    entityId: industry._id,
    entityName: industry.name,
    user: req.user,
  });

  res.status(201).json({ success: true, industry });
});

const updateIndustry = asyncHandler(async (req, res) => {
  const industry = await Industry.findById(req.params.id);
  if (!industry) return res.status(404).json({ success: false, message: 'Industry not found' });

  const previousVersion = industry.version;
  const reason = req.body.reason || 'Updated via admin';
  const bumpVersion = req.body.bumpVersion !== false;

  Object.assign(industry, req.body);
  delete industry.reason;
  delete industry.bumpVersion;

  industry.updatedBy = req.user._id;
  if (bumpVersion) {
    industry.versionNumber += 1;
    const [maj, min, patch] = (previousVersion || '1.0.0').split('.').map(Number);
    industry.version = `${maj || 1}.${min || 0}.${(patch || 0) + 1}`;
  }

  if (industry.ratios?.[0]) {
    const primary =
      industry.ratios.find((r) => r.key === industry.primaryRatio) || industry.ratios[0];
    industry.averageMargin = primary?.average || 0;
    industry.primaryBenchmark = `${primary?.name || 'Primary'}: ${primary?.average}${primary?.unit || '%'}`;
  }

  await industry.save();

  await BenchmarkVersion.create({
    industryId: industry._id,
    version: industry.version,
    versionNumber: industry.versionNumber,
    previousVersion,
    reason,
    snapshot: industry.toObject(),
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await writeLog({
    action: 'update',
    entityType: 'industry',
    entityId: industry._id,
    entityName: industry.name,
    details: { reason, version: industry.version },
    user: req.user,
  });

  res.json({ success: true, industry });
});

const deleteIndustry = asyncHandler(async (req, res) => {
  const industry = await Industry.findByIdAndUpdate(
    req.params.id,
    { status: 'archived', updatedBy: req.user._id },
    { new: true }
  );
  if (!industry) return res.status(404).json({ success: false, message: 'Industry not found' });
  await writeLog({
    action: 'delete',
    entityType: 'industry',
    entityId: industry._id,
    entityName: industry.name,
    user: req.user,
  });
  res.json({ success: true, message: 'Industry archived' });
});

const cloneIndustry = asyncHandler(async (req, res) => {
  const source = await Industry.findById(req.params.id).lean();
  if (!source) return res.status(404).json({ success: false, message: 'Industry not found' });

  const name = req.body.name || `${source.name} (Copy)`;
  const { _id, createdAt, updatedAt, usageCount, verified, verifiedBy, verifiedAt, ...rest } = source;
  const clone = await Industry.create({
    ...rest,
    name,
    slug: slugify(`${name}-${Date.now()}`),
    status: 'draft',
    verified: false,
    version: '1.0.0',
    versionNumber: 1,
    usageCount: 0,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await writeLog({
    action: 'clone',
    entityType: 'industry',
    entityId: clone._id,
    entityName: clone.name,
    details: { sourceId: source._id },
    user: req.user,
  });

  res.status(201).json({ success: true, industry: clone });
});

const publishIndustry = asyncHandler(async (req, res) => {
  const industry = await Industry.findByIdAndUpdate(
    req.params.id,
    {
      status: 'published',
      publishedAt: new Date(),
      updatedBy: req.user._id,
    },
    { new: true }
  );
  if (!industry) return res.status(404).json({ success: false, message: 'Industry not found' });
  await writeLog({
    action: 'publish',
    entityType: 'industry',
    entityId: industry._id,
    entityName: industry.name,
    user: req.user,
  });
  res.json({ success: true, industry });
});

const verifyIndustry = asyncHandler(async (req, res) => {
  const industry = await Industry.findByIdAndUpdate(
    req.params.id,
    {
      verified: true,
      status: req.body.publish ? 'published' : 'pending',
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      updatedBy: req.user._id,
    },
    { new: true }
  );
  if (!industry) return res.status(404).json({ success: false, message: 'Industry not found' });
  await writeLog({
    action: 'verify',
    entityType: 'industry',
    entityId: industry._id,
    entityName: industry.name,
    user: req.user,
  });
  res.json({ success: true, industry });
});

// ─── Calculator ──────────────────────────────────────────
const calculateBenchmark = asyncHandler(async (req, res) => {
  const { industryId, financialYear, client, inputs, save = true } = req.body;
  if (!industryId) return res.status(400).json({ success: false, message: 'industryId required' });
  if (!client?.name) return res.status(400).json({ success: false, message: 'client.name required' });

  const industry = await Industry.findById(industryId);
  if (!industry) return res.status(404).json({ success: false, message: 'Industry not found' });

  const { ratios: clientRatios, computed } = calculateFinancialRatios(inputs || {});
  const compared = compareToIndustry(clientRatios, industry.ratios);
  const { riskScore, overallStatus } = computeRiskScore(compared);
  const recommendations = generateInsights(compared, riskScore);
  const charts = buildChartPayload(compared);

  let result = null;
  let report = null;

  if (save) {
    result = await BenchmarkResult.create({
      client: {
        name: client.name,
        company: client.company || '',
        notes: client.notes || '',
      },
      industryId: industry._id,
      industryName: industry.name,
      financialYear: financialYear || 'FY2025',
      allInputs: { ...inputs, computed },
      calculatedRatios: compared,
      riskScore,
      overallStatus,
      recommendations,
      charts,
      createdBy: req.user._id,
    });

    report = await BenchmarkReport.create({
      title: `${client.name} – ${industry.name} Benchmark`,
      clientName: client.name,
      company: client.company || '',
      industryId: industry._id,
      industryName: industry.name,
      financialYear: financialYear || 'FY2025',
      turnover: Number(inputs?.revenue) || Number(client?.turnover) || 0,
      riskScore,
      overallStatus,
      resultId: result._id,
      version: industry.version,
      notes: client.notes || '',
      createdBy: req.user._id,
      createdByName: req.user.name,
    });

    result.reportId = report._id;
    await result.save();

    industry.usageCount = (industry.usageCount || 0) + 1;
    await industry.save();

    await writeLog({
      action: 'calculate',
      entityType: 'result',
      entityId: result._id,
      entityName: client.name,
      details: { riskScore, overallStatus, industry: industry.name },
      user: req.user,
    });
  }

  res.json({
    success: true,
    calculation: {
      clientRatios,
      computed,
      compared,
      riskScore,
      overallStatus,
      recommendations,
      charts,
      industry: {
        _id: industry._id,
        name: industry.name,
        version: industry.version,
        category: industry.category,
      },
    },
    result,
    report,
  });
});

const previewCalculate = asyncHandler(async (req, res) => {
  const { industryId, inputs } = req.body;
  const industry = await Industry.findById(industryId).lean();
  if (!industry) return res.status(404).json({ success: false, message: 'Industry not found' });

  const { ratios: clientRatios, computed } = calculateFinancialRatios(inputs || {});
  const compared = compareToIndustry(clientRatios, industry.ratios);
  const { riskScore, overallStatus } = computeRiskScore(compared);
  const recommendations = generateInsights(compared, riskScore);
  const charts = buildChartPayload(compared);

  res.json({
    success: true,
    calculation: {
      clientRatios,
      computed,
      compared,
      riskScore,
      overallStatus,
      recommendations,
      charts,
    },
  });
});

// ─── Reports ─────────────────────────────────────────────
const listReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { search, status, industryId, financialYear, sort = 'newest' } = req.query;
  const q = {};
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    q.$or = [{ clientName: rx }, { company: rx }, { industryName: rx }, { title: rx }];
  }
  if (status && status !== 'all') q.overallStatus = status;
  if (industryId) q.industryId = industryId;
  if (financialYear) q.financialYear = financialYear;

  const sortOpt = sort === 'risk' ? { riskScore: -1 } : { createdAt: -1 };

  const [reports, total] = await Promise.all([
    BenchmarkReport.find(q).sort(sortOpt).skip(skip).limit(limit).lean(),
    BenchmarkReport.countDocuments(q),
  ]);

  res.json({
    success: true,
    reports,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

const getReport = asyncHandler(async (req, res) => {
  const report = await BenchmarkReport.findById(req.params.id).lean();
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
  const result = report.resultId
    ? await BenchmarkResult.findById(report.resultId).lean()
    : null;
  res.json({ success: true, report, result });
});

const deleteReport = asyncHandler(async (req, res) => {
  const report = await BenchmarkReport.findByIdAndDelete(req.params.id);
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
  if (report.resultId) await BenchmarkResult.findByIdAndDelete(report.resultId);
  await writeLog({
    action: 'delete',
    entityType: 'report',
    entityId: report._id,
    entityName: report.title,
    user: req.user,
  });
  res.json({ success: true, message: 'Report deleted' });
});

const duplicateReport = asyncHandler(async (req, res) => {
  const source = await BenchmarkReport.findById(req.params.id).lean();
  if (!source) return res.status(404).json({ success: false, message: 'Report not found' });
  const { _id, createdAt, updatedAt, ...rest } = source;
  const dup = await BenchmarkReport.create({
    ...rest,
    title: `${rest.title} (Copy)`,
    createdBy: req.user._id,
    createdByName: req.user.name,
  });
  res.status(201).json({ success: true, report: dup });
});

// ─── Analytics ───────────────────────────────────────────
const getAnalytics = asyncHandler(async (_req, res) => {
  const [
    mostUsed,
    avgRisk,
    monthly,
    growth,
    distribution,
    accuracy,
  ] = await Promise.all([
    Industry.find({ status: 'published' })
      .sort({ usageCount: -1 })
      .limit(10)
      .select('name category usageCount averageMargin')
      .lean(),
    BenchmarkResult.aggregate([{ $group: { _id: null, avg: { $avg: '$riskScore' } } }]),
    BenchmarkReport.aggregate([
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
      { $limit: 12 },
    ]),
    BenchmarkResult.aggregate([
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          clients: { $addToSet: '$client.name' },
        },
      },
      { $project: { count: { $size: '$clients' }, _id: 1 } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
      { $limit: 12 },
    ]),
    Industry.aggregate([
      { $match: { status: { $ne: 'archived' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    BenchmarkResult.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          within: {
            $sum: {
              $cond: [{ $in: ['$overallStatus', ['low', 'moderate']] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const total = accuracy?.[0]?.total || 0;
  const within = accuracy?.[0]?.within || 0;

  res.json({
    success: true,
    analytics: {
      mostUsedIndustries: mostUsed,
      averageRisk: Math.round(avgRisk?.[0]?.avg || 0),
      benchmarkAccuracy: total ? Math.round((within / total) * 100) : 0,
      monthlyReports: monthly.map((m) => ({
        month: `${months[m._id.m - 1]} ${m._id.y}`,
        count: m.count,
      })),
      clientGrowth: growth.map((g) => ({
        month: `${months[g._id.m - 1]} ${g._id.y}`,
        clients: g.count,
      })),
      industryDistribution: distribution.map((d) => ({ name: d._id, value: d.count })),
    },
  });
});

// ─── Settings ────────────────────────────────────────────
const getSettings = asyncHandler(async (_req, res) => {
  let settings = await Settings.findOne({ key: 'global' });
  if (!settings) settings = await Settings.create({ key: 'global' });
  res.json({ success: true, settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.findOneAndUpdate(
    { key: 'global' },
    { ...req.body, updatedBy: req.user._id },
    { new: true, upsert: true }
  );
  await writeLog({
    action: 'settings',
    entityType: 'settings',
    entityId: settings._id,
    entityName: 'global',
    user: req.user,
  });
  res.json({ success: true, settings });
});

// ─── Import / Export ─────────────────────────────────────
const previewImport = asyncHandler(async (req, res) => {
  const XLSX = require('xlsx');
  if (!req.file) return res.status(400).json({ success: false, message: 'File required' });

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const columns = rows.length ? Object.keys(rows[0]) : [];
  const columnMap = {};
  const aliases = {
    name: ['name', 'industry', 'industry name', 'industry_name'],
    category: ['category', 'industry category', 'sector'],
    description: ['description', 'desc', 'details'],
    primaryRatio: ['primaryratio', 'primary_ratio', 'primary'],
    min: ['min', 'minimum', 'industry min'],
    average: ['average', 'avg', 'industry average'],
    max: ['max', 'maximum', 'industry max'],
  };

  for (const [field, keys] of Object.entries(aliases)) {
    const found = columns.find((c) => keys.includes(String(c).toLowerCase().trim()));
    if (found) columnMap[field] = found;
  }

  const errors = [];
  const preview = rows.slice(0, 50).map((row, idx) => {
    const mapped = {
      name: row[columnMap.name] || '',
      category: row[columnMap.category] || 'Other',
      description: row[columnMap.description] || '',
    };
    if (!mapped.name) errors.push({ row: idx + 2, field: 'name', message: 'Name is required' });
    return mapped;
  });

  const validRows = preview.filter((r) => r.name).length;
  const imp = await BenchmarkImport.create({
    fileName: req.file.originalname,
    fileType: req.file.originalname.endsWith('.csv') ? 'csv' : 'xlsx',
    status: 'preview',
    totalRows: rows.length,
    validRows,
    invalidRows: rows.length - validRows,
    columnMap,
    preview,
    rowErrors: errors,
    createdBy: req.user._id,
  });

  res.json({
    success: true,
    import: imp,
    columns,
    columnMap,
    preview,
    errors,
  });
});

const confirmImport = asyncHandler(async (req, res) => {
  const imp = await BenchmarkImport.findById(req.params.id);
  if (!imp) return res.status(404).json({ success: false, message: 'Import not found' });

  const rows = req.body.rows || imp.preview || [];
  let importedCount = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.name) {
      errors.push({ row: i + 1, field: 'name', message: 'Missing name' });
      continue;
    }
    try {
      const slug = slugify(`${row.name}-${Date.now()}-${i}`);
      await Industry.create({
        name: row.name,
        slug,
        description: row.description || '',
        category: row.category || 'Other',
        status: 'pending',
        verified: false,
        ratios: row.ratios || [],
        tags: row.tags || [],
        createdBy: req.user._id,
        updatedBy: req.user._id,
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

  await writeLog({
    action: 'import',
    entityType: 'import',
    entityId: imp._id,
    entityName: imp.fileName,
    details: { importedCount, errors: errors.length },
    user: req.user,
  });

  res.json({ success: true, import: imp, importedCount, errors });
});

const exportIndustries = asyncHandler(async (req, res) => {
  const XLSX = require('xlsx');
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

  await writeLog({
    action: 'export',
    entityType: 'industry',
    entityName: 'bulk-export',
    details: { count: rows.length },
    user: req.user,
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=benchmark-industries.xlsx');
  res.send(buf);
});

const listLogs = asyncHandler(async (req, res) => {
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

const listVersions = asyncHandler(async (req, res) => {
  const versions = await BenchmarkVersion.find({ industryId: req.params.id })
    .sort({ versionNumber: -1 })
    .populate('createdBy', 'name')
    .lean();
  res.json({ success: true, versions });
});

module.exports = {
  getDashboard,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listIndustries,
  getIndustry,
  createIndustry,
  updateIndustry,
  deleteIndustry,
  cloneIndustry,
  publishIndustry,
  verifyIndustry,
  calculateBenchmark,
  previewCalculate,
  listReports,
  getReport,
  deleteReport,
  duplicateReport,
  getAnalytics,
  getSettings,
  updateSettings,
  previewImport,
  confirmImport,
  exportIndustries,
  listLogs,
  listVersions,
};
