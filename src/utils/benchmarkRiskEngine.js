/**
 * Weighted Risk Engine
 * 0-25 LOW | 26-50 MEDIUM | 51-75 HIGH | 76-100 CRITICAL
 */

const DEFAULT_WEIGHTS = {
  gross_margin: 1.5,
  net_margin: 1.5,
  cost_ratio: 1.2,
  payroll_ratio: 1.3,
  expense_ratio: 1.1,
  rent_ratio: 1.0,
  vehicle_ratio: 0.9,
  operating_margin: 1.2,
  roa: 1.0,
  roe: 1.0,
  debt_ratio: 1.1,
  current_ratio: 1.0,
  quick_ratio: 0.9,
  inventory_turnover: 0.8,
  cash_ratio: 1.0,
};

const HIGHER_IS_BETTER = new Set([
  'gross_margin',
  'net_margin',
  'operating_margin',
  'roa',
  'roe',
  'current_ratio',
  'quick_ratio',
  'inventory_turnover',
  'cash_ratio',
  'working_capital',
]);

function compareWithIndustry(clientRatios = {}, industryRatios = []) {
  const map = {};
  for (const r of industryRatios) {
    const key = r.ratioKey || r.key;
    map[key] = r;
  }

  const compared = [];
  const keys = Object.keys(clientRatios).length
    ? Object.keys(clientRatios)
    : industryRatios.map((r) => r.ratioKey || r.key);

  for (const key of keys) {
    const industry = map[key];
    if (!industry && clientRatios[key] == null) continue;

    const clientValue = Number(clientRatios[key]) || 0;
    const min = Number(industry?.minimum ?? industry?.min ?? 0);
    const average = Number(industry?.average ?? 0);
    const max = Number(industry?.maximum ?? industry?.max ?? 100);
    const higherIsBetter =
      industry?.higherIsBetter != null ? industry.higherIsBetter : HIGHER_IS_BETTER.has(key);

    let status = 'within';
    if (higherIsBetter) {
      if (clientValue < min) status = 'high';
      else if (clientValue < average * 0.9) status = 'slight';
    } else if (clientValue > max) status = 'high';
    else if (clientValue > average * 1.1) status = 'slight';

    compared.push({
      ratioKey: key,
      key,
      ratioName: industry?.ratioName || industry?.name || key,
      name: industry?.ratioName || industry?.name || key,
      clientValue,
      industryMin: min,
      industryAverage: average,
      industryMax: max,
      difference: Math.round((clientValue - average) * 100) / 100,
      status,
      recommendation:
        industry?.recommendation ||
        (status === 'within'
          ? 'Within industry expected range.'
          : status === 'slight'
            ? 'Slightly outside benchmark — review and monitor.'
            : 'Materially outside benchmark — prioritise corrective action.'),
      unit: industry?.unit || '%',
      weight: industry?.weight || DEFAULT_WEIGHTS[key] || 1,
      higherIsBetter,
    });
  }

  return compared;
}

function calculateOverallRisk(comparedRatios = [], thresholds = { low: 25, medium: 50, high: 75 }) {
  if (!comparedRatios.length) {
    return { riskScore: 0, overallStatus: 'low', label: 'LOW' };
  }

  let weighted = 0;
  let totalWeight = 0;

  for (const r of comparedRatios) {
    const w = r.weight || DEFAULT_WEIGHTS[r.ratioKey || r.key] || 1;
    totalWeight += w;
    const penalty = r.status === 'high' ? 85 : r.status === 'slight' ? 45 : 10;
    weighted += penalty * w;
  }

  const riskScore = Math.min(100, Math.round(weighted / (totalWeight || 1)));
  let overallStatus = 'low';
  let label = 'LOW';

  if (riskScore > (thresholds.high ?? 75)) {
    overallStatus = 'critical';
    label = 'CRITICAL';
  } else if (riskScore > (thresholds.medium ?? 50)) {
    overallStatus = 'high';
    label = 'HIGH';
  } else if (riskScore > (thresholds.low ?? 25)) {
    overallStatus = 'medium';
    label = 'MEDIUM';
  }

  // Alias moderate for frontend compatibility
  if (overallStatus === 'medium') {
    return { riskScore, overallStatus: 'moderate', label: 'MEDIUM', band: 'medium' };
  }

  return { riskScore, overallStatus, label, band: overallStatus };
}

module.exports = {
  DEFAULT_WEIGHTS,
  HIGHER_IS_BETTER,
  compareWithIndustry,
  calculateOverallRisk,
};
