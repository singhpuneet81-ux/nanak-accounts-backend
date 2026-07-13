const BenchmarkReport = require('../../models/BenchmarkReport');
const BenchmarkResult = require('../../models/BenchmarkResult');
const Industry = require('../../models/Industry');
const { paginate, escapeRegex, writeBenchmarkLog, cacheClear } = require('../../utils/benchmarkHelpers');
const { runCalculation } = require('./benchmark.service');

async function listReports(query) {
  const { page, limit, skip } = paginate(query);
  const { search, status, industryId, financialYear, sort = 'newest' } = query;
  const q = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    q.$or = [{ clientName: rx }, { company: rx }, { industryName: rx }, { title: rx }, { clientId: rx }];
  }
  if (status && status !== 'all') {
    if (['low', 'medium', 'moderate', 'high', 'critical'].includes(status)) q.overallStatus = status === 'medium' ? 'moderate' : status;
    else q.status = status;
  }
  if (industryId) q.industryId = industryId;
  if (financialYear) q.financialYear = financialYear;

  const sortOpt = sort === 'risk' ? { riskScore: -1 } : { createdAt: -1 };
  const [reports, total] = await Promise.all([
    BenchmarkReport.find(q).sort(sortOpt).skip(skip).limit(limit).lean(),
    BenchmarkReport.countDocuments(q),
  ]);

  return {
    reports: reports.map((r) => ({
      ...r,
      createdByName: r.generatedByName,
      createdBy: r.generatedBy,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

async function getReport(id) {
  const report = await BenchmarkReport.findById(id).lean();
  if (!report) {
    const err = new Error('Report not found');
    err.statusCode = 404;
    throw err;
  }
  const result = report.resultId ? await BenchmarkResult.findById(report.resultId).lean() : null;
  return {
    report: {
      ...report,
      createdByName: report.generatedByName,
    },
    result,
  };
}

async function createReportFromCalculation({
  industryId,
  financialYear,
  clientInformation,
  financialInputs,
  notes,
  user,
  save = true,
}) {
  const client = clientInformation || {};
  const { calculation, industry } = await runCalculation({
    industryId,
    financialInputs,
    financialYear,
    clientInformation: client,
    user,
    save: true,
  });

  if (!save) return { calculation };

  const result = await BenchmarkResult.create({
    clientId: client.clientId || client.id || slugClient(client.name),
    industryId: industry._id,
    industryName: industry.name,
    financialYear: calculation.financialYear,
    financialInputs: calculation.normalizedInputs,
    calculated: calculation.calculated,
    calculatedRatios: calculation.calculatedRatios,
    riskScore: calculation.riskScore,
    overallStatus: calculation.overallStatus,
    recommendations: calculation.recommendations,
    charts: calculation.charts,
    benchmarkVersion: industry.version,
    createdBy: user._id,
  });

  const report = await BenchmarkReport.create({
    title: `${client.name || 'Client'} – ${industry.name} Benchmark`,
    clientId: result.clientId,
    clientName: client.name || 'Client',
    company: client.company || '',
    industryId: industry._id,
    industryName: industry.name,
    financialYear: calculation.financialYear,
    clientInformation: client,
    financialInputs: calculation.normalizedInputs,
    calculatedRatios: calculation.calculatedRatios,
    riskScore: calculation.riskScore,
    overallStatus: calculation.overallStatus,
    recommendations: calculation.recommendations,
    charts: calculation.charts,
    notes: notes || client.notes || '',
    version: industry.version,
    resultId: result._id,
    turnover: Number(client.turnover || calculation.normalizedInputs.revenue) || 0,
    generatedBy: user._id,
    generatedByName: user.name,
    status: 'final',
  });

  result.reportId = report._id;
  await result.save();

  industry.usageCount = (industry.usageCount || 0) + 1;
  await industry.save();
  cacheClear('benchmark:');

  return {
    calculation: {
      ...calculation,
      // keep frontend keys
      compared: calculation.calculatedRatios,
    },
    result,
    report: {
      ...report.toObject(),
      createdByName: report.generatedByName,
    },
  };
}

function slugClient(name) {
  return String(name || 'client')
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .slice(0, 40);
}

async function updateReport(id, data, user) {
  const report = await BenchmarkReport.findByIdAndUpdate(
    id,
    { ...data, updatedBy: user._id },
    { new: true }
  );
  if (!report) {
    const err = new Error('Report not found');
    err.statusCode = 404;
    throw err;
  }
  await writeBenchmarkLog({
    action: 'updated',
    entityType: 'report',
    entityId: report._id,
    entityName: report.title,
    user,
  });
  return report;
}

async function deleteReport(id, user) {
  const report = await BenchmarkReport.findByIdAndDelete(id);
  if (!report) {
    const err = new Error('Report not found');
    err.statusCode = 404;
    throw err;
  }
  if (report.resultId) await BenchmarkResult.findByIdAndDelete(report.resultId);
  await writeBenchmarkLog({
    action: 'deleted',
    entityType: 'report',
    entityId: report._id,
    entityName: report.title,
    user,
  });
  cacheClear('benchmark:');
  return report;
}

async function duplicateReport(id, user) {
  const source = await BenchmarkReport.findById(id).lean();
  if (!source) {
    const err = new Error('Report not found');
    err.statusCode = 404;
    throw err;
  }
  const { _id, createdAt, updatedAt, approvedBy, approvedAt, ...rest } = source;
  const dup = await BenchmarkReport.create({
    ...rest,
    title: `${rest.title} (Copy)`,
    status: 'draft',
    generatedBy: user._id,
    generatedByName: user.name,
  });
  return dup;
}

async function approveReport(id, user) {
  const report = await BenchmarkReport.findByIdAndUpdate(
    id,
    { status: 'approved', approvedBy: user._id, approvedAt: new Date() },
    { new: true }
  );
  if (!report) {
    const err = new Error('Report not found');
    err.statusCode = 404;
    throw err;
  }
  await writeBenchmarkLog({
    action: 'approved',
    entityType: 'report',
    entityId: report._id,
    entityName: report.title,
    user,
  });
  return report;
}

module.exports = {
  listReports,
  getReport,
  createReportFromCalculation,
  updateReport,
  deleteReport,
  duplicateReport,
  approveReport,
};
