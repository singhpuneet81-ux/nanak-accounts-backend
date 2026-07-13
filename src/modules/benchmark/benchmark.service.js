const Industry = require('../../models/Industry');
const BenchmarkVersion = require('../../models/BenchmarkVersion');
const BenchmarkSetting = require('../../models/BenchmarkSetting');
const { calculateAllRatios } = require('../../utils/benchmarkCalculator');
const { compareWithIndustry, calculateOverallRisk } = require('../../utils/benchmarkRiskEngine');
const {
  generateRecommendations,
  buildChartPayload,
} = require('../../utils/benchmarkRecommendationEngine');
const { cacheGet, cacheSet, cacheClear, writeBenchmarkLog, slugify } = require('../../utils/benchmarkHelpers');
const { generateBenchmarkPDF } = require('../../utils/benchmarkPDFGenerator');

async function getOrCreateSettings() {
  let settings = await BenchmarkSetting.findOne({ key: 'global' });
  if (!settings) settings = await BenchmarkSetting.create({ key: 'global' });
  return settings;
}

function pickIndustryRatios(industry, turnover) {
  if (turnover != null && industry.turnoverBands?.length) {
    const band = industry.turnoverBands.find((b) => {
      const minOk = turnover >= (b.minimumTurnover || 0);
      const maxOk = b.maximumTurnover == null || turnover <= b.maximumTurnover;
      return minOk && maxOk;
    });
    if (band?.ratios?.length) return band.ratios;
  }
  return industry.ratios || [];
}

async function runCalculation({
  industryId,
  financialInputs,
  financialYear,
  clientInformation,
  user,
  save = false,
}) {
  const industry = await Industry.findById(industryId);
  if (!industry) {
    const err = new Error('Industry not found');
    err.statusCode = 404;
    throw err;
  }

  const inputs = financialInputs || {};
  const client = clientInformation || {};
  const turnover = Number(client.turnover ?? inputs.revenue) || 0;
  const industryRatios = pickIndustryRatios(industry, turnover);

  const { ratios, calculated, inputs: normalized } = calculateAllRatios(inputs);
  const compared = compareWithIndustry(ratios, industryRatios).map((r) => ({
    ...r,
    key: r.ratioKey || r.key,
    name: r.ratioName || r.name,
  }));
  const settings = await getOrCreateSettings();
  const { riskScore, overallStatus } = calculateOverallRisk(compared, settings.riskThresholds);
  const recommendations = generateRecommendations(compared, riskScore);
  const charts = buildChartPayload(compared);
  calculated.riskScore = riskScore;

  const payload = {
    calculatedRatios: compared,
    // frontend alias
    compared,
    riskScore,
    overallStatus,
    status: overallStatus,
    recommendations,
    charts,
    comparisonTable: charts.comparisonTable,
    calculated,
    clientRatios: ratios,
    computed: {
      grossProfit: normalized.grossProfit,
      totalOpEx: normalized.operatingExpenses,
      netProfit: normalized.netProfit,
      ebitda: normalized.ebitda,
      workingCapital: normalized.workingCapital,
      equity: normalized.equity,
    },
    industry: {
      _id: industry._id,
      name: industry.name,
      version: industry.version,
      category: industry.category,
    },
    financialYear: financialYear || settings.defaultFinancialYear || 'FY2025',
    normalizedInputs: normalized,
  };

  if (!save) return { calculation: payload, industry, settings };

  // persistence handled by report service callers
  await writeBenchmarkLog({
    action: 'calculated',
    entityType: 'result',
    entityName: client.name || clientInformation?.name || 'calculation',
    details: { riskScore, overallStatus, industry: industry.name },
    user,
  });

  return { calculation: payload, industry, settings };
}

async function createVersionSnapshot(industry, { reason, user, previousVersion }) {
  return BenchmarkVersion.create({
    industryId: industry._id,
    version: industry.version,
    versionNumber: industry.versionNumber,
    previousVersion: previousVersion || null,
    reason: reason || 'Version update',
    snapshot: industry.toObject ? industry.toObject() : industry,
    createdBy: user?._id,
    updatedBy: user?._id,
  });
}

async function listVersions({ industryId, page, limit, skip }) {
  const q = industryId ? { industryId } : {};
  const [versions, total] = await Promise.all([
    BenchmarkVersion.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name')
      .lean(),
    BenchmarkVersion.countDocuments(q),
  ]);
  return { versions, total };
}

async function updateSettings(data, user) {
  const settings = await BenchmarkSetting.findOneAndUpdate(
    { key: 'global' },
    { ...data, updatedBy: user._id },
    { new: true, upsert: true }
  );
  cacheClear('benchmark:');
  await writeBenchmarkLog({
    action: 'settings',
    entityType: 'settings',
    entityId: settings._id,
    entityName: 'global',
    user,
  });
  return settings;
}

async function buildPdfBuffer(report, result) {
  const settings = await getOrCreateSettings();
  return generateBenchmarkPDF({ report, result, settings });
}

module.exports = {
  getOrCreateSettings,
  pickIndustryRatios,
  runCalculation,
  createVersionSnapshot,
  listVersions,
  updateSettings,
  buildPdfBuffer,
  slugify,
  cacheGet,
  cacheSet,
  cacheClear,
};
