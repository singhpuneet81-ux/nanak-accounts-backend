/**
 * Recommendation Engine — severity-aware insights
 */

function generateRecommendations(comparedRatios = [], riskScore = 0) {
  const insights = [];

  for (const r of comparedRatios) {
    const absDiff = Math.abs(r.difference || 0);
    const unit = r.unit || '%';
    const name = r.ratioName || r.name;
    const key = r.ratioKey || r.key;
    const direction = (r.difference || 0) >= 0 ? 'above' : 'below';

    if (r.status === 'within') {
      if (r.higherIsBetter && (r.difference || 0) > 3) {
        insights.push({
          message: `Operating performance for ${name} is excellent.`,
          severity: 'low',
          recommendation: 'Maintain current operating practices.',
          priority: 4,
          expectedImpact: 'Sustained competitive advantage',
          ratioKey: key,
        });
      }
      continue;
    }

    const severity = r.status === 'high' ? 'critical' : 'medium';
    let advice = r.recommendation || `Review ${name} relative to peers.`;

    if (key === 'payroll_ratio' && direction === 'above') {
      advice = 'Consider reviewing staffing costs and productivity.';
    } else if (key === 'inventory_turnover' && direction === 'below') {
      advice = 'Inventory turnover is below average — review stock levels.';
    } else if (key === 'rent_ratio' && direction === 'above') {
      advice = 'Rent is higher than similar businesses.';
    } else if (key === 'vehicle_ratio' && direction === 'above') {
      advice = 'Vehicle expenses exceed expected range.';
    } else if (key === 'operating_margin' && direction === 'below') {
      advice = 'Operating margin requires attention.';
    } else if (key === 'payroll_ratio') {
      advice = `Payroll ${direction === 'above' ? 'exceeds' : 'is below'} benchmark by ${absDiff}${unit}.`;
    }

    insights.push({
      message: `${name} is ${absDiff}${unit} ${direction} industry average.`,
      severity,
      recommendation: advice,
      priority: severity === 'critical' ? 1 : 2,
      expectedImpact:
        severity === 'critical'
          ? 'High impact on profitability and compliance risk'
          : 'Moderate impact — schedule operational review',
      ratioKey: key,
    });
  }

  if (riskScore <= 25) {
    insights.unshift({
      message: 'Overall risk profile is low relative to industry peers.',
      severity: 'low',
      recommendation: 'Continue routine monitoring each financial year.',
      priority: 5,
      expectedImpact: 'Stable benchmark position',
      ratioKey: 'overall',
    });
  } else if (riskScore > 75) {
    insights.unshift({
      message: 'Critical overall risk score — immediate management review recommended.',
      severity: 'critical',
      recommendation: 'Escalate to advisor and prepare a remediation plan within 30 days.',
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
      metric: r.ratioName || r.name,
      client: r.clientValue,
      industry: r.industryAverage,
    })),
    bar: comparedRatios.map((r) => ({
      name: r.ratioName || r.name,
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
    comparisonTable: comparedRatios.map((r) => ({
      ratio: r.ratioName || r.name,
      client: r.clientValue,
      min: r.industryMin,
      average: r.industryAverage,
      max: r.industryMax,
      difference: r.difference,
      status: r.status,
      unit: r.unit,
    })),
  };
}

module.exports = {
  generateRecommendations,
  buildChartPayload,
};
