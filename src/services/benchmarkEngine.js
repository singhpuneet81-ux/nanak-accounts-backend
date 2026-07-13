/**
 * Benchmark calculation & risk engine
 */

const DEFAULT_RATIOS = [
  { key: 'gross_margin', name: 'Gross Margin', higherIsBetter: true, weight: 1.5 },
  { key: 'net_margin', name: 'Net Margin', higherIsBetter: true, weight: 1.5 },
  { key: 'cost_ratio', name: 'Cost of Sales Ratio', higherIsBetter: false, weight: 1.2 },
  { key: 'payroll_ratio', name: 'Payroll Ratio', higherIsBetter: false, weight: 1.3 },
  { key: 'expense_ratio', name: 'Expense Ratio', higherIsBetter: false, weight: 1.1 },
  { key: 'rent_ratio', name: 'Rent Ratio', higherIsBetter: false, weight: 1.0 },
  { key: 'operating_margin', name: 'Operating Margin', higherIsBetter: true, weight: 1.2 },
  { key: 'ebitda_margin', name: 'EBITDA Margin', higherIsBetter: true, weight: 1.1 },
  { key: 'current_ratio', name: 'Current Ratio', higherIsBetter: true, weight: 1.0, unit: 'x' },
  { key: 'quick_ratio', name: 'Quick Ratio', higherIsBetter: true, weight: 0.9, unit: 'x' },
  { key: 'debt_ratio', name: 'Debt Ratio', higherIsBetter: false, weight: 1.1 },
  { key: 'roa', name: 'Return on Assets', higherIsBetter: true, weight: 1.0 },
  { key: 'roe', name: 'Return on Equity', higherIsBetter: true, weight: 1.0 },
  { key: 'cash_flow_ratio', name: 'Cash Flow Ratio', higherIsBetter: true, weight: 1.0, unit: 'x' },
  { key: 'inventory_turnover', name: 'Inventory Turnover', higherIsBetter: true, weight: 0.8, unit: 'x' },
];

function pct(numerator, denominator) {
  if (!denominator || denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

function ratio(numerator, denominator) {
  if (!denominator || denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100) / 100;
}

function calculateFinancialRatios(inputs) {
  const revenue = Number(inputs.revenue) || 0;
  const cos = Number(inputs.costOfSales) || 0;
  const grossProfit = inputs.grossProfit != null ? Number(inputs.grossProfit) : revenue - cos;
  const operatingExpenses = Number(inputs.operatingExpenses) || 0;
  const payroll = Number(inputs.payroll) || 0;
  const rent = Number(inputs.rent) || 0;
  const marketing = Number(inputs.marketing) || 0;
  const utilities = Number(inputs.utilities) || 0;
  const vehicle = Number(inputs.vehicleExpenses) || 0;
  const insurance = Number(inputs.insurance) || 0;
  const admin = Number(inputs.administration) || 0;
  const interest = Number(inputs.interest) || 0;
  const depreciation = Number(inputs.depreciation) || 0;
  const otherExpenses = Number(inputs.otherExpenses) || 0;

  const totalOpEx =
    operatingExpenses ||
    payroll + rent + marketing + utilities + vehicle + insurance + admin + otherExpenses;

  const netProfit =
    inputs.netProfit != null
      ? Number(inputs.netProfit)
      : grossProfit - totalOpEx - interest - depreciation;

  const assets = Number(inputs.assets) || 0;
  const liabilities = Number(inputs.liabilities) || 0;
  const inventory = Number(inputs.inventory) || 0;
  const cash = Number(inputs.cash) || 0;
  const ar = Number(inputs.accountsReceivable) || 0;
  const ap = Number(inputs.accountsPayable) || 0;
  const equity = assets - liabilities;
  const workingCapital = cash + ar + inventory - ap;
  const ebitda = netProfit + interest + depreciation;
  const currentAssets = cash + ar + inventory;

  return {
    computed: {
      grossProfit,
      totalOpEx,
      netProfit,
      workingCapital,
      ebitda,
      equity,
    },
    ratios: {
      gross_margin: pct(grossProfit, revenue),
      net_margin: pct(netProfit, revenue),
      cost_ratio: pct(cos, revenue),
      payroll_ratio: pct(payroll, revenue),
      expense_ratio: pct(totalOpEx, revenue),
      rent_ratio: pct(rent, revenue),
      profit_pct: pct(netProfit, revenue),
      operating_margin: pct(grossProfit - totalOpEx, revenue),
      ebitda_margin: pct(ebitda, revenue),
      inventory_turnover: inventory ? ratio(cos, inventory) : 0,
      working_capital: workingCapital,
      current_ratio: ap ? ratio(currentAssets, ap) : currentAssets > 0 ? 2 : 0,
      quick_ratio: ap ? ratio(cash + ar, ap) : cash + ar > 0 ? 1.5 : 0,
      debt_ratio: pct(liabilities, assets || 1),
      roa: pct(netProfit, assets || 1),
      roe: pct(netProfit, equity || 1),
      cash_flow_ratio: ap ? ratio(cash, ap) : cash > 0 ? 1 : 0,
    },
  };
}

function compareToIndustry(clientRatios, industryRatios = []) {
  const map = {};
  for (const r of industryRatios) {
    map[r.key] = r;
  }

  const compared = [];
  const meta = DEFAULT_RATIOS;

  for (const def of meta) {
    const industry = map[def.key];
    if (!industry && clientRatios[def.key] == null) continue;

    const clientValue = Number(clientRatios[def.key]) || 0;
    const min = industry?.min ?? 0;
    const average = industry?.average ?? 0;
    const max = industry?.max ?? 100;
    const difference = Math.round((clientValue - average) * 100) / 100;

    let status = 'within';
    if (def.higherIsBetter) {
      if (clientValue < min) status = 'high';
      else if (clientValue < average * 0.9) status = 'slight';
      else status = 'within';
    } else {
      if (clientValue > max) status = 'high';
      else if (clientValue > average * 1.1) status = 'slight';
      else status = 'within';
    }

    compared.push({
      key: def.key,
      name: industry?.name || def.name,
      clientValue,
      industryMin: min,
      industryAverage: average,
      industryMax: max,
      difference,
      status,
      recommendation:
        industry?.recommendation ||
        (status === 'within'
          ? 'Within industry expected range.'
          : status === 'slight'
            ? 'Slightly outside benchmark — review and monitor.'
            : 'Materially outside benchmark — prioritise corrective action.'),
      unit: industry?.unit || def.unit || '%',
      weight: industry?.weight || def.weight,
      higherIsBetter: def.higherIsBetter,
    });
  }

  return compared;
}

function computeRiskScore(comparedRatios = []) {
  if (!comparedRatios.length) return { riskScore: 0, overallStatus: 'low' };

  let weighted = 0;
  let totalWeight = 0;

  for (const r of comparedRatios) {
    const w = r.weight || 1;
    totalWeight += w;
    const penalty = r.status === 'high' ? 85 : r.status === 'slight' ? 45 : 10;
    weighted += penalty * w;
  }

  const riskScore = Math.min(100, Math.round(weighted / (totalWeight || 1)));
  let overallStatus = 'low';
  if (riskScore > 75) overallStatus = 'critical';
  else if (riskScore > 50) overallStatus = 'high';
  else if (riskScore > 25) overallStatus = 'moderate';

  return { riskScore, overallStatus };
}

function generateInsights(comparedRatios = [], riskScore = 0) {
  const insights = [];

  for (const r of comparedRatios) {
    if (r.status === 'within') {
      if (Math.abs(r.difference) < 2) continue;
      if (r.higherIsBetter && r.difference > 3) {
        insights.push({
          message: `${r.name} exceeds industry average by ${Math.abs(r.difference)}${r.unit}.`,
          severity: 'success',
          recommendation: 'Maintain current operating practices.',
          priority: 4,
          expectedImpact: 'Sustained competitive advantage',
          ratioKey: r.key,
        });
      }
      continue;
    }

    const direction = r.difference >= 0 ? 'above' : 'below';
    insights.push({
      message: `${r.name} is ${Math.abs(r.difference)}${r.unit} ${direction} industry average.`,
      severity: r.status === 'high' ? 'critical' : 'warning',
      recommendation: r.recommendation,
      priority: r.status === 'high' ? 1 : 2,
      expectedImpact:
        r.status === 'high'
          ? 'High impact on profitability and compliance risk'
          : 'Moderate impact — schedule operational review',
      ratioKey: r.key,
    });
  }

  if (riskScore <= 25) {
    insights.unshift({
      message: 'Overall risk profile is low relative to industry peers.',
      severity: 'success',
      recommendation: 'Continue routine monitoring each financial year.',
      priority: 5,
      expectedImpact: 'Stable benchmark position',
      ratioKey: 'overall',
    });
  } else if (riskScore > 75) {
    insights.unshift({
      message: 'Critical overall risk score — immediate management review recommended.',
      severity: 'critical',
      recommendation: 'Escalate to advisor and prepare remediation plan within 30 days.',
      priority: 1,
      expectedImpact: 'Material financial and compliance risk',
      ratioKey: 'overall',
    });
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

function buildChartPayload(comparedRatios = []) {
  return {
    radar: comparedRatios.slice(0, 8).map((r) => ({
      metric: r.name,
      client: r.clientValue,
      industry: r.industryAverage,
    })),
    bar: comparedRatios.map((r) => ({
      name: r.name,
      client: r.clientValue,
      min: r.industryMin,
      average: r.industryAverage,
      max: r.industryMax,
    })),
    distribution: [
      { name: 'Within Range', value: comparedRatios.filter((r) => r.status === 'within').length },
      { name: 'Slightly Outside', value: comparedRatios.filter((r) => r.status === 'slight').length },
      { name: 'High Risk', value: comparedRatios.filter((r) => r.status === 'high').length },
    ],
  };
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = {
  DEFAULT_RATIOS,
  calculateFinancialRatios,
  compareToIndustry,
  computeRiskScore,
  generateInsights,
  buildChartPayload,
  slugify,
  pct,
  ratio,
};
