const Industry = require('../../models/Industry');
const BenchmarkReport = require('../../models/BenchmarkReport');
const BenchmarkResult = require('../../models/BenchmarkResult');
const { cacheGet, cacheSet } = require('../../utils/benchmarkHelpers');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

async function getDashboard() {
  const cacheKey = 'benchmark:dashboard';
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

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
    BenchmarkResult.aggregate([{ $group: { _id: '$clientId' } }, { $count: 'count' }]),
    BenchmarkResult.aggregate([{ $group: { _id: null, avg: { $avg: '$riskScore' } } }]),
    BenchmarkReport.countDocuments({ overallStatus: { $in: ['high', 'critical'] } }),
    BenchmarkReport.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('title clientName company industryName financialYear riskScore overallStatus createdAt generatedByName')
      .lean(),
    BenchmarkReport.aggregate([
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
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
    BenchmarkReport.aggregate([{ $group: { _id: '$overallStatus', count: { $sum: 1 } } }]),
    Industry.find({ status: 'published' })
      .sort({ usageCount: -1 })
      .limit(8)
      .select('name category usageCount averageMargin verified')
      .lean(),
  ]);

  const clientsChecked = clientsAgg?.[0]?.count || 0;
  const averageScore = Math.round(avgScoreAgg?.[0]?.avg || 0);
  const successTotal = await BenchmarkResult.countDocuments();
  const successLow = await BenchmarkResult.countDocuments({
    overallStatus: { $in: ['low', 'moderate', 'medium'] },
  });
  const benchmarkSuccessPct = successTotal ? Math.round((successLow / successTotal) * 100) : 0;

  const payload = {
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
    recentReports: recentReports.map((r) => ({
      ...r,
      createdByName: r.generatedByName,
    })),
    charts: {
      monthlyReports: monthlyReports.map((r) => ({
        month: `${MONTHS[(r._id.m || 1) - 1]} ${r._id.y}`,
        reports: r.count,
        avgRisk: Math.round(r.avgRisk || 0),
      })),
      industryDistribution: industryDistribution.map((d) => ({ name: d._id, value: d.count })),
      riskDistribution: riskDistribution.map((d) => ({ name: d._id, value: d.count })),
      mostUsedIndustries: mostUsed.map((i) => ({
        name: i.name,
        usage: i.usageCount,
        category: i.category,
        margin: i.averageMargin,
      })),
      averageClientPosition: averageScore,
    },
  };

  cacheSet(cacheKey, payload, 90);
  return payload;
}

async function getMonthly() {
  const data = await BenchmarkReport.aggregate([
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        count: { $sum: 1 },
        avgRisk: { $avg: '$riskScore' },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
    { $limit: 24 },
  ]);
  return data.map((m) => ({
    month: `${MONTHS[m._id.m - 1]} ${m._id.y}`,
    count: m.count,
    avgRisk: Math.round(m.avgRisk || 0),
  }));
}

async function getRiskAnalytics() {
  return BenchmarkReport.aggregate([
    { $group: { _id: '$overallStatus', count: { $sum: 1 }, avgScore: { $avg: '$riskScore' } } },
    { $sort: { count: -1 } },
  ]);
}

async function getCategoryAnalytics() {
  return Industry.aggregate([
    { $match: { status: { $ne: 'archived' } } },
    { $group: { _id: '$category', count: { $sum: 1 }, verified: { $sum: { $cond: ['$verified', 1, 0] } } } },
    { $sort: { count: -1 } },
  ]);
}

async function getIndustryAnalytics() {
  const mostUsed = await Industry.find({ status: 'published' })
    .sort({ usageCount: -1 })
    .limit(15)
    .select('name category usageCount averageMargin verified')
    .lean();

  const avgRisk = await BenchmarkResult.aggregate([{ $group: { _id: null, avg: { $avg: '$riskScore' } } }]);
  const accuracy = await BenchmarkResult.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        within: {
          $sum: { $cond: [{ $in: ['$overallStatus', ['low', 'moderate', 'medium']] }, 1, 0] },
        },
      },
    },
  ]);
  const monthly = await getMonthly();
  const growth = await BenchmarkResult.aggregate([
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        clients: { $addToSet: '$clientId' },
      },
    },
    { $project: { count: { $size: '$clients' }, _id: 1 } },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
    { $limit: 12 },
  ]);
  const distribution = await getCategoryAnalytics();
  const total = accuracy?.[0]?.total || 0;
  const within = accuracy?.[0]?.within || 0;

  return {
    mostUsedIndustries: mostUsed,
    averageRisk: Math.round(avgRisk?.[0]?.avg || 0),
    benchmarkAccuracy: total ? Math.round((within / total) * 100) : 0,
    monthlyReports: monthly,
    clientGrowth: growth.map((g) => ({
      month: `${MONTHS[g._id.m - 1]} ${g._id.y}`,
      clients: g.count,
    })),
    industryDistribution: distribution.map((d) => ({ name: d._id, value: d.count })),
  };
}

module.exports = {
  getDashboard,
  getMonthly,
  getRiskAnalytics,
  getCategoryAnalytics,
  getIndustryAnalytics,
};
