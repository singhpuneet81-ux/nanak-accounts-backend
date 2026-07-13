/**
 * Benchmark Calculator — standardized ratio computations
 */

function pct(numerator, denominator) {
  if (!denominator || denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

function ratio(numerator, denominator) {
  if (!denominator || denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100) / 100;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeInputs(raw = {}) {
  const revenue = num(raw.revenue);
  const costOfSales = num(raw.costOfSales ?? raw.CostOfSales);
  const payroll = num(raw.payroll ?? raw.Payroll);
  const rent = num(raw.rent ?? raw.Rent);
  const marketing = num(raw.marketing ?? raw.Marketing);
  const insurance = num(raw.insurance ?? raw.Insurance);
  const utilities = num(raw.utilities ?? raw.Utilities);
  const administration = num(raw.administration ?? raw.Administration);
  const vehicles = num(raw.vehicles ?? raw.vehicleExpenses ?? raw.Vehicles);
  const depreciation = num(raw.depreciation ?? raw.Depreciation);
  const interest = num(raw.interest ?? raw.Interest);
  const inventory = num(raw.inventory ?? raw.Inventory);
  const assets = num(raw.assets ?? raw.Assets);
  const liabilities = num(raw.liabilities ?? raw.Liabilities);
  const receivables = num(raw.receivables ?? raw.accountsReceivable ?? raw.Receivables);
  const payables = num(raw.payables ?? raw.accountsPayable ?? raw.Payables);
  const cash = num(raw.cash ?? raw.Cash);
  const otherExpenses = num(raw.otherExpenses ?? raw.OtherExpenses);
  const operatingExpenses =
    num(raw.operatingExpenses) ||
    payroll + rent + marketing + insurance + utilities + administration + vehicles + otherExpenses;

  const grossProfit = raw.grossProfit != null ? num(raw.grossProfit) : revenue - costOfSales;
  const netProfit =
    raw.netProfit != null
      ? num(raw.netProfit)
      : grossProfit - operatingExpenses - interest - depreciation;

  return {
    revenue,
    costOfSales,
    payroll,
    rent,
    marketing,
    insurance,
    utilities,
    administration,
    vehicles,
    vehicleExpenses: vehicles,
    depreciation,
    interest,
    inventory,
    assets,
    liabilities,
    receivables,
    accountsReceivable: receivables,
    payables,
    accountsPayable: payables,
    cash,
    otherExpenses,
    operatingExpenses,
    grossProfit,
    netProfit,
    equity: assets - liabilities,
    ebitda: netProfit + interest + depreciation,
    workingCapital: cash + receivables + inventory - payables,
    currentAssets: cash + receivables + inventory,
  };
}

function calculateGrossMargin(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return { key: 'gross_margin', name: 'Gross Margin', value: pct(i.grossProfit, i.revenue), unit: '%' };
}

function calculateNetMargin(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return { key: 'net_margin', name: 'Net Margin', value: pct(i.netProfit, i.revenue), unit: '%' };
}

function calculateExpenseRatio(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return { key: 'expense_ratio', name: 'Expense Ratio', value: pct(i.operatingExpenses, i.revenue), unit: '%' };
}

function calculatePayrollRatio(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return { key: 'payroll_ratio', name: 'Payroll Ratio', value: pct(i.payroll, i.revenue), unit: '%' };
}

function calculateRentRatio(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return { key: 'rent_ratio', name: 'Rent Ratio', value: pct(i.rent, i.revenue), unit: '%' };
}

function calculateVehicleRatio(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return { key: 'vehicle_ratio', name: 'Vehicle Ratio', value: pct(i.vehicles, i.revenue), unit: '%' };
}

function calculateROA(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return { key: 'roa', name: 'Return on Assets', value: pct(i.netProfit, i.assets || 1), unit: '%' };
}

function calculateROE(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return { key: 'roe', name: 'Return on Equity', value: pct(i.netProfit, i.equity || 1), unit: '%' };
}

function calculateDebtRatio(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return { key: 'debt_ratio', name: 'Debt Ratio', value: pct(i.liabilities, i.assets || 1), unit: '%' };
}

function calculateCurrentRatio(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return {
    key: 'current_ratio',
    name: 'Current Ratio',
    value: i.payables ? ratio(i.currentAssets, i.payables) : i.currentAssets > 0 ? 2 : 0,
    unit: 'x',
  };
}

function calculateQuickRatio(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  const quick = i.cash + i.receivables;
  return {
    key: 'quick_ratio',
    name: 'Quick Ratio',
    value: i.payables ? ratio(quick, i.payables) : quick > 0 ? 1.5 : 0,
    unit: 'x',
  };
}

function calculateWorkingCapital(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return { key: 'working_capital', name: 'Working Capital', value: i.workingCapital, unit: '$' };
}

function calculateInventoryTurnover(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return {
    key: 'inventory_turnover',
    name: 'Inventory Turnover',
    value: i.inventory ? ratio(i.costOfSales, i.inventory) : 0,
    unit: 'x',
  };
}

function calculateCashRatio(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return {
    key: 'cash_ratio',
    name: 'Cash Ratio',
    value: i.payables ? ratio(i.cash, i.payables) : i.cash > 0 ? 1 : 0,
    unit: 'x',
  };
}

function calculateOperatingMargin(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return {
    key: 'operating_margin',
    name: 'Operating Margin',
    value: pct(i.grossProfit - i.operatingExpenses, i.revenue),
    unit: '%',
  };
}

function calculateCostRatio(inputs) {
  const i = typeof inputs.revenue === 'number' ? inputs : normalizeInputs(inputs);
  return { key: 'cost_ratio', name: 'Cost of Sales Ratio', value: pct(i.costOfSales, i.revenue), unit: '%' };
}

function calculateAllRatios(rawInputs) {
  const inputs = normalizeInputs(rawInputs);
  const list = [
    calculateGrossMargin(inputs),
    calculateNetMargin(inputs),
    calculateCostRatio(inputs),
    calculateExpenseRatio(inputs),
    calculatePayrollRatio(inputs),
    calculateRentRatio(inputs),
    calculateVehicleRatio(inputs),
    calculateOperatingMargin(inputs),
    calculateROA(inputs),
    calculateROE(inputs),
    calculateDebtRatio(inputs),
    calculateCurrentRatio(inputs),
    calculateQuickRatio(inputs),
    calculateInventoryTurnover(inputs),
    calculateCashRatio(inputs),
    calculateWorkingCapital(inputs),
  ];

  const map = {};
  for (const r of list) map[r.key] = r.value;

  return {
    inputs,
    ratios: map,
    ratioList: list,
    calculated: {
      grossMargin: map.gross_margin,
      netMargin: map.net_margin,
      expenseRatio: map.expense_ratio,
      payrollRatio: map.payroll_ratio,
      rentRatio: map.rent_ratio,
      vehicleRatio: map.vehicle_ratio,
      operatingMargin: map.operating_margin,
      roa: map.roa,
      roe: map.roe,
      currentRatio: map.current_ratio,
      quickRatio: map.quick_ratio,
      debtRatio: map.debt_ratio,
      inventoryTurnover: map.inventory_turnover,
      cashRatio: map.cash_ratio,
      workingCapital: map.working_capital,
    },
  };
}

module.exports = {
  pct,
  ratio,
  num,
  normalizeInputs,
  calculateGrossMargin,
  calculateNetMargin,
  calculateExpenseRatio,
  calculatePayrollRatio,
  calculateRentRatio,
  calculateVehicleRatio,
  calculateROA,
  calculateROE,
  calculateDebtRatio,
  calculateCurrentRatio,
  calculateQuickRatio,
  calculateWorkingCapital,
  calculateInventoryTurnover,
  calculateCashRatio,
  calculateOperatingMargin,
  calculateCostRatio,
  calculateAllRatios,
};
