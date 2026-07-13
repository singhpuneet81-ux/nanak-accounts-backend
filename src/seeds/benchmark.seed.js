/**
 * Benchmark Intelligence Seeder
 * Usage: npm run seed:benchmarks
 *
 * Seeds: 20 categories, 100 industries, bulk reports/results, versions, settings
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const BenchmarkCategory = require('../models/BenchmarkCategory');
const Industry = require('../models/Industry');
const BenchmarkReport = require('../models/BenchmarkReport');
const BenchmarkResult = require('../models/BenchmarkResult');
const BenchmarkSetting = require('../models/BenchmarkSetting');
const BenchmarkVersion = require('../models/BenchmarkVersion');
const BenchmarkLog = require('../models/BenchmarkLog');
const { calculateAllRatios } = require('../utils/benchmarkCalculator');
const { compareWithIndustry, calculateOverallRisk } = require('../utils/benchmarkRiskEngine');
const { generateRecommendations, buildChartPayload } = require('../utils/benchmarkRecommendationEngine');
const { slugify } = require('../utils/benchmarkHelpers');

const CATEGORIES = [
  'Retail', 'Construction', 'Hospitality', 'Transport', 'Manufacturing',
  'Healthcare', 'Education', 'Professional Services', 'Finance', 'Automotive',
  'Real Estate', 'Technology', 'Food', 'Agriculture', 'Beauty',
  'Mining', 'Logistics', 'Entertainment', 'Other', 'Wholesale',
];

const SEGMENT = {
  Retail: ['Clothing Retail', 'Electronics Retail', 'Grocery Stores', 'Furniture Retail', 'Pharmacy Retail'],
  Construction: ['Residential Building', 'Commercial Construction', 'Civil Engineering', 'Electrical Contractors', 'Plumbing Services'],
  Hospitality: ['Cafes', 'Restaurants', 'Hotels', 'Bars & Pubs', 'Catering Services'],
  Transport: ['Freight Trucking', 'Taxi Services', 'Courier Services', 'Bus Operators', 'Warehousing Transport'],
  Manufacturing: ['Food Manufacturing', 'Metal Fabrication', 'Plastic Products', 'Furniture Manufacturing', 'Machinery'],
  Healthcare: ['General Practice Clinics', 'Dental Practices', 'Allied Health', 'Pathology Labs', 'Aged Care'],
  Education: ['Private Tutoring', 'Childcare Centres', 'RTOs', 'Language Schools', 'Corporate Training'],
  'Professional Services': ['Accounting Firms', 'Legal Practices', 'Consulting', 'Marketing Agencies', 'Engineering Consultancies'],
  Finance: ['Mortgage Brokers', 'Financial Advisers', 'Insurance Brokers', 'Bookkeeping Firms', 'Wealth Advisory'],
  Automotive: ['Car Dealerships', 'Auto Repair', 'Auto Parts', 'Car Wash', 'Tyre Retailers'],
  'Real Estate': ['Residential Agencies', 'Property Management', 'Commercial Real Estate', 'Strata Management', 'Valuers'],
  Technology: ['Software Development', 'IT Managed Services', 'Web Agencies', 'SaaS Companies', 'Cybersecurity'],
  Food: ['Bakeries', 'Butchers', 'Takeaway Food', 'Food Wholesalers', 'Specialty Food'],
  Agriculture: ['Crop Farming', 'Livestock', 'Horticulture', 'Agri Services', 'Viticulture'],
  Beauty: ['Hair Salons', 'Beauty Spas', 'Nail Salons', 'Barbershops', 'Cosmetic Clinics'],
  Mining: ['Mining Services', 'Quarrying', 'Exploration Support', 'Drill Services', 'Site Support'],
  Logistics: ['3PL Providers', 'Fulfillment Centres', 'Last Mile Delivery', 'Cold Storage', 'Freight Forwarding'],
  Entertainment: ['Event Venues', 'Fitness Centres', 'Cinemas', 'Amusement', 'Gaming Venues'],
  Other: ['Cleaning Services', 'Security Services', 'Landscaping', 'Printing', 'Facilities Mgmt'],
  Wholesale: ['General Wholesale', 'Food Wholesale', 'Building Supplies', 'Electrical Wholesale', 'Hardware Wholesale'],
};

const RATIO_DEFS = [
  { ratioName: 'Gross Margin', ratioKey: 'gross_margin', weight: 1.5, higherIsBetter: true, unit: '%' },
  { ratioName: 'Net Margin', ratioKey: 'net_margin', weight: 1.5, higherIsBetter: true, unit: '%' },
  { ratioName: 'Cost of Sales Ratio', ratioKey: 'cost_ratio', weight: 1.2, higherIsBetter: false, unit: '%' },
  { ratioName: 'Payroll Ratio', ratioKey: 'payroll_ratio', weight: 1.3, higherIsBetter: false, unit: '%' },
  { ratioName: 'Expense Ratio', ratioKey: 'expense_ratio', weight: 1.1, higherIsBetter: false, unit: '%' },
  { ratioName: 'Rent Ratio', ratioKey: 'rent_ratio', weight: 1.0, higherIsBetter: false, unit: '%' },
  { ratioName: 'Vehicle Ratio', ratioKey: 'vehicle_ratio', weight: 0.9, higherIsBetter: false, unit: '%' },
  { ratioName: 'Operating Margin', ratioKey: 'operating_margin', weight: 1.2, higherIsBetter: true, unit: '%' },
  { ratioName: 'Return on Assets', ratioKey: 'roa', weight: 1.0, higherIsBetter: true, unit: '%' },
  { ratioName: 'Return on Equity', ratioKey: 'roe', weight: 1.0, higherIsBetter: true, unit: '%' },
  { ratioName: 'Current Ratio', ratioKey: 'current_ratio', weight: 1.0, higherIsBetter: true, unit: 'x' },
  { ratioName: 'Quick Ratio', ratioKey: 'quick_ratio', weight: 0.9, higherIsBetter: true, unit: 'x' },
  { ratioName: 'Debt Ratio', ratioKey: 'debt_ratio', weight: 1.1, higherIsBetter: false, unit: '%' },
  { ratioName: 'Inventory Turnover', ratioKey: 'inventory_turnover', weight: 0.8, higherIsBetter: true, unit: 'x' },
  { ratioName: 'Cash Ratio', ratioKey: 'cash_ratio', weight: 1.0, higherIsBetter: true, unit: 'x' },
];

function buildRatios(seed = 1) {
  return RATIO_DEFS.map((d, i) => {
    const avg = d.unit === 'x'
      ? Math.round((1.2 + (i % 5) * 0.15 + ((seed % 5) - 2) * 0.05) * 100) / 100
      : Math.round((18 + (i % 8) * 3 + ((seed % 7) - 3)) * 10) / 10;
    const minimum = Math.round(avg * 0.7 * 10) / 10;
    const maximum = Math.round(avg * 1.35 * 10) / 10;
    return {
      ...d,
      minimum,
      average: avg,
      maximum,
      description: `${d.ratioName} industry benchmark range.`,
      recommendation: `Maintain ${d.ratioName} within ${minimum}–${maximum}${d.unit}.`,
      severity: 'medium',
      formula: d.ratioKey,
    };
  });
}

const FIRST = ['Apex', 'Summit', 'Harbour', 'Pacific', 'Gateway', 'Northern', 'Coastal', 'Metro', 'Prime', 'Horizon'];
const LAST = ['Group', 'Pty Ltd', 'Holdings', 'Partners', 'Enterprises', 'Solutions', 'Industries', 'Services'];
const PEOPLE = ['James Wilson', 'Sarah Chen', 'Michael Brown', 'Emily Davis', 'David Nguyen', 'Olivia Taylor', 'Liam Anderson', 'Sophia Martinez', 'Noah Patel', 'Ava Roberts'];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  await connectDB();
  console.log('Seeding Benchmark Intelligence (modular)...');

  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Benchmark Admin',
      email: 'benchmark.admin@nanak.local',
      password: 'Admin123!',
      role: 'admin',
    });
  }

  await Promise.all([
    BenchmarkCategory.deleteMany({}),
    Industry.deleteMany({}),
    BenchmarkReport.deleteMany({}),
    BenchmarkResult.deleteMany({}),
    BenchmarkVersion.deleteMany({}),
    BenchmarkLog.deleteMany({}),
    BenchmarkSetting.deleteMany({}),
  ]);

  await BenchmarkSetting.create({ key: 'global' });

  const categoryDocs = CATEGORIES.map((name, i) => ({
    name,
    slug: slugify(name),
    description: `${name} industry benchmarks across Australian SMEs.`,
    sortOrder: i,
    status: 'active',
    color: '#f97316',
    createdBy: admin._id,
  }));
  const categories = await BenchmarkCategory.insertMany(categoryDocs);
  const catMap = new Map(categories.map((c) => [c.name, c]));

  const industryDocs = [];
  let idx = 0;
  for (const cat of CATEGORIES) {
    const names = SEGMENT[cat] || [`${cat} General`];
    for (const name of names) {
      idx += 1;
      const ratios = buildRatios(idx);
      const primary = ratios.find((r) => r.ratioKey === 'gross_margin') || ratios[0];
      const verified = idx % 4 !== 0;
      industryDocs.push({
        name,
        slug: slugify(`${name}-${idx}`),
        description: `ATO-aligned performance benchmarks for ${name.toLowerCase()} businesses in Australia.`,
        category: cat,
        categoryId: catMap.get(cat)?._id,
        verified,
        verificationDate: verified ? new Date(Date.now() - idx * 86400000) : undefined,
        verifiedBy: verified ? admin._id : undefined,
        status: verified ? 'published' : idx % 7 === 0 ? 'pending' : 'published',
        primaryRatio: 'gross_margin',
        primaryBenchmark: `Gross Margin: ${primary.average}%`,
        atoReference: `ATO BI ${1000 + idx}`,
        riskNotes: verified
          ? 'Derived from anonymised SME datasets and ATO small business benchmarks.'
          : 'Pending verification against latest ATO release.',
        averageMargin: primary.average,
        tags: [cat.toLowerCase(), 'sme', 'ato', verified ? 'verified' : 'pending'],
        ratios,
        turnoverBands: [
          { label: 'Under $2m', minimumTurnover: 0, maximumTurnover: 2000000, ratios: buildRatios(idx + 10) },
          { label: '$2m–$10m', minimumTurnover: 2000000, maximumTurnover: 10000000, ratios: buildRatios(idx + 20) },
        ],
        documents: [{ name: `${name} Benchmark Pack.pdf`, url: '/uploads/samples/sample-benchmark.pdf', type: 'pdf' }],
        version: `1.${idx % 5}.0`,
        versionNumber: 1 + (idx % 5),
        usageCount: randInt(0, 120),
        publishedAt: new Date(),
        createdBy: admin._id,
        updatedBy: admin._id,
      });
    }
  }

  const industries = await Industry.insertMany(industryDocs);
  console.log(`Industries: ${industries.length}`);

  // category counts
  for (const cat of categories) {
    cat.industryCount = await Industry.countDocuments({ category: cat.name });
    await cat.save();
  }

  // versions
  const versionDocs = industries.map((ind) => ({
    industryId: ind._id,
    version: ind.version,
    versionNumber: ind.versionNumber,
    reason: 'Seeded baseline',
    snapshot: ind.toObject(),
    createdBy: admin._id,
    updatedBy: admin._id,
  }));
  await BenchmarkVersion.insertMany(versionDocs);

  // Bulk calculations — 1000 reports (practical dense seed; scale further via import)
  const TARGET = Number(process.env.BENCHMARK_SEED_REPORTS || 1000);
  const years = ['FY2023', 'FY2024', 'FY2025'];
  const reportDocs = [];
  const resultDocs = [];

  console.log(`Generating ${TARGET} benchmark reports...`);
  for (let i = 0; i < TARGET; i++) {
    const industry = industries[i % industries.length];
    const clientName = rand(PEOPLE);
    const company = `${rand(FIRST)} ${rand(LAST)}`;
    const clientId = `client-${(i % 500) + 1}`;
    const revenue = randInt(250000, 5000000);
    const inputs = {
      revenue,
      costOfSales: Math.round(revenue * (0.35 + Math.random() * 0.3)),
      payroll: Math.round(revenue * (0.12 + Math.random() * 0.15)),
      rent: Math.round(revenue * (0.03 + Math.random() * 0.08)),
      marketing: Math.round(revenue * 0.02),
      utilities: Math.round(revenue * 0.015),
      vehicles: Math.round(revenue * 0.01),
      insurance: Math.round(revenue * 0.008),
      administration: Math.round(revenue * 0.03),
      interest: Math.round(revenue * 0.01),
      depreciation: Math.round(revenue * 0.02),
      otherExpenses: Math.round(revenue * 0.02),
      assets: Math.round(revenue * (0.5 + Math.random())),
      liabilities: Math.round(revenue * (0.2 + Math.random() * 0.4)),
      inventory: Math.round(revenue * 0.1),
      cash: Math.round(revenue * 0.08),
      receivables: Math.round(revenue * 0.12),
      payables: Math.round(revenue * 0.06),
    };

    const { ratios, calculated, inputs: normalized } = calculateAllRatios(inputs);
    const compared = compareWithIndustry(ratios, industry.ratios);
    let { riskScore, overallStatus } = calculateOverallRisk(compared);
    if (i % 11 === 0) {
      riskScore = 80 + (i % 15);
      overallStatus = 'critical';
    } else if (i % 7 === 0) {
      riskScore = 55 + (i % 15);
      overallStatus = 'high';
    }
    calculated.riskScore = riskScore;
    const recommendations = generateRecommendations(compared, riskScore);
    const charts = buildChartPayload(compared);
    const fy = years[i % years.length];
    const createdAt = new Date(Date.now() - randInt(1, 400) * 86400000);
    const resultId = new mongoose.Types.ObjectId();
    const reportId = new mongoose.Types.ObjectId();

    resultDocs.push({
      _id: resultId,
      reportId,
      clientId,
      industryId: industry._id,
      industryName: industry.name,
      financialYear: fy,
      financialInputs: normalized,
      calculated,
      calculatedRatios: compared,
      riskScore,
      overallStatus,
      recommendations,
      charts,
      benchmarkVersion: industry.version,
      createdBy: admin._id,
      createdAt,
      updatedAt: createdAt,
    });

    reportDocs.push({
      _id: reportId,
      title: `${clientName} – ${industry.name} Benchmark`,
      clientId,
      clientName,
      company,
      industryId: industry._id,
      industryName: industry.name,
      financialYear: fy,
      clientInformation: { name: clientName, company, turnover: revenue, notes: 'Seeded' },
      financialInputs: normalized,
      calculatedRatios: compared,
      riskScore,
      overallStatus,
      recommendations,
      charts,
      notes: 'Seeded calculation',
      version: industry.version,
      resultId,
      turnover: revenue,
      generatedBy: admin._id,
      generatedByName: admin.name,
      status: 'final',
      createdAt,
      updatedAt: createdAt,
    });

    if (resultDocs.length >= 200) {
      await BenchmarkResult.insertMany(resultDocs.splice(0));
      await BenchmarkReport.insertMany(reportDocs.splice(0));
      process.stdout.write('.');
    }
  }
  if (resultDocs.length) {
    await BenchmarkResult.insertMany(resultDocs);
    await BenchmarkReport.insertMany(reportDocs);
  }
  console.log('\nReports inserted.');

  const logDocs = [];
  for (let i = 0; i < 100; i++) {
    logDocs.push({
      action: rand(['created', 'updated', 'calculated', 'exported', 'imported', 'published', 'approved']),
      entityType: rand(['industry', 'report', 'result', 'import']),
      entityName: `Seed activity ${i + 1}`,
      createdBy: admin._id,
      createdByName: admin.name,
    });
  }
  await BenchmarkLog.insertMany(logDocs);

  const stats = {
    categories: await BenchmarkCategory.countDocuments(),
    industries: await Industry.countDocuments(),
    reports: await BenchmarkReport.countDocuments(),
    results: await BenchmarkResult.countDocuments(),
    versions: await BenchmarkVersion.countDocuments(),
    logs: await BenchmarkLog.countDocuments(),
    uniqueClients: 500,
  };

  console.log('Seed complete:', stats);
  console.log('Tip: set BENCHMARK_SEED_REPORTS=5000 for maximum volume (slower).');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
