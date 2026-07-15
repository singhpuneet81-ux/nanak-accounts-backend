// Default pricing configuration for the Quote Pad module.
// Ported from nanak-household-quote-pad-v2.html — every value here is
// editable from the admin panel (Quote Pad → Prices) and stored in Mongo.

const B_BANDS = [
  ['0–100k', 1250], ['100–150k', 1450], ['150–200k', 1650], ['200–250k', 1850],
  ['250–300k', 2050], ['300–350k', 2250], ['350–400k', 2450], ['400–500k', 2650],
  ['500–600k', 2850], ['600–700k', 3050], ['700–800k', 3250], ['800–900k', 3450],
  ['900k–1.0m', 3650], ['1.0–1.25m', 4050], ['1.25–1.5m', 4450], ['1.5–1.75m', 4850],
  ['1.75–2.0m', 5250], ['2.0–2.25m', 5650], ['2.25–2.5m', 6050], ['2.5–2.75m', 6450],
  ['2.75–3.0m', 6850], ['3.0–3.5m', 7250], ['3.5–4.0m', 7650], ['4.0–4.5m', 8050],
  ['4.5–5.0m', 8450],
];

const B_BAND_ENTITIES = ['Company', 'Trust', 'Family Trust', 'Partnership'];

function bRound50(x) {
  return Math.round(x / 50) * 50;
}

function defaultFirm() {
  return {
    name: 'Nanak Accountants & Associates',
    abn: '47 648 226 804',
    phone: '1300 626 258',
    email: 'info@nanakaccountants.com.au',
    validDays: 14,
    gst: 0.10,
    maxDiscountPct: 20,
  };
}

function defaultHouseholdConfig() {
  return {
    individualBase: 120,
    rentalSingle: 75,
    rentalCouple: 50,
    shareBrokerReportBase: 50,
    shareBrokerIncludedDisposals: 10,
    shareBrokerExtraDisposal: 5,
    shareAdditionalBroker: 25,
    shareManualPerDisposal: 10,
    shareManualMinimum: 50,
    shareAutomaticLimit: 20,
    shareComplexStartingPrice: 250,
    cfdStandard: 100,
    cfdAdditionalBroker: 50,
    cfdComplexStartingPrice: 250,
    cryptoSummary: 75,
    cryptoReview: 150,
    cryptoComplexStartingPrice: 300,
    // Sole trader TOTAL fee (replaces the individual base). Last band = accountant review.
    soleTraderBands: [
      ['$0 – $75k', 160],
      ['$75k – $150k', 250],
      ['$150k – $250k', 350],
      ['$250k – $400k', 500],
      ['More than $400k', 0],
    ],
    cgtProperty: 199,
    foreign: 100,
    basPerLodgement: 100,
    basMinorReconciliation: 50,
    strategicPlanning: 150,
  };
}

function defaultBusinessConfig() {
  const factors = { Company: 1.0, Trust: 0.95, 'Family Trust': 0.95, Partnership: 0.72 };
  const existingRates = {};
  const newRates = {};
  B_BAND_ENTITIES.forEach((e) => {
    existingRates[e] = B_BANDS.map((b) => (e === 'Company' ? b[1] : bRound50(b[1] * factors[e])));
    newRates[e] = existingRates[e].map((v) => bRound50(v * 0.85));
  });

  return {
    bandLabels: B_BANDS.map((b) => b[0]),
    existingRates,
    newRates,
    smsf: {
      existing: [
        ['Simple (1–2 members)', 1650],
        ['Standard (pension / 3–4)', 2200],
        ['Complex (LRBA / property)', 2900],
      ],
      neu: [
        ['Simple (1–2 members)', 1400],
        ['Standard (pension / 3–4)', 1870],
        ['Complex (LRBA / property)', 2465],
      ],
    },
    nfp: {
      existing: [
        ['Small (< $250k)', 1200],
        ['Medium ($250k–$1m)', 2400],
        ['Large (> $1m)', 3900],
      ],
      neu: [
        ['Small (< $250k)', 1020],
        ['Medium ($250k–$1m)', 2040],
        ['Large (> $1m)', 3315],
      ],
    },
    planning: {
      Company: { name: 'Annual Business Tax Planning', price: 300 },
      Trust: { name: 'Annual Trust Distribution & Tax Planning', price: 300 },
      'Family Trust': { name: 'Annual Family Trust Distribution & Tax Planning', price: 300 },
      Partnership: { name: 'Annual Partnership Tax Planning', price: 300 },
      SMSF: { name: 'Annual SMSF Strategy Review', price: 300 },
      NFP: { name: 'Annual Governance & Compliance Review', price: 300 },
    },
    advisoryUpgrade: 1000,
    payroll: {
      supportFlat: 330,
      process: {
        Monthly: { '1–3': 720, '4–5': 960, '6–10': 1440, '11–15': 2100, 'More than 15 – owner review': 0 },
        Fortnightly: { '1–3': 1200, '4–5': 1500, '6–10': 2200, '11–15': 3200, 'More than 15 – owner review': 0 },
        Weekly: { '1–3': 1800, '4–5': 2200, '6–10': 3200, '11–15': 4800, 'More than 15 – owner review': 0 },
      },
    },
    bookkeeping: { quarterly: 1320, monthly: 2640, cleanup: 990 },
    monthlyBasUplift: 600,
    propertyIncluded: 1,
    propertyExtra: 250,
    shareLargeFrom: 250,
    setups: [
      { id: 'company_reg', name: 'Company registration & setup', price: 950, gov: true, note: 'ASIC registration, ABN/TFN/GST. ASIC fee included.' },
      { id: 'trust_est', name: 'Trust establishment', price: 660, gov: false, note: 'Trust deed, ABN/TFN. Stamp duty excluded.' },
      { id: 'company_trust', name: 'Company + trust establishment', price: 1500, gov: true, note: 'Corporate trustee + trust. ASIC fee included.' },
      { id: 'smsf_setup', name: 'SMSF establishment', price: 1650, gov: false, note: 'Fund deed, trustee, ABN/TFN. Gov fees excluded.' },
      { id: 'smsf_corp', name: 'New SMSF + corporate trustee', price: 2200, gov: true, note: 'SMSF + special-purpose trustee. ASIC fee included.' },
      { id: 'bare_trust', name: 'Bare trust setup (LRBA)', price: 880, gov: false, note: 'Bare trust deed. Gov fees excluded.' },
      { id: 'partnership_setup', name: 'New partnership setup', price: 550, gov: false, note: 'Agreement referral, ABN/TFN, GST. Gov fees excluded.' },
      { id: 'nfp_incorp', name: 'Incorporated Association setup', price: 1500, gov: false, note: 'Rules & registration. State fee excluded.' },
      { id: 'nfp_clg', name: 'Company Limited by Guarantee setup', price: 2200, gov: true, note: 'Constitution & ASIC registration. ASIC fee included.' },
      { id: 'nfp_ctrust', name: 'Charitable Trust setup', price: 1800, gov: false, note: 'Charitable trust deed. Gov fees excluded.' },
      { id: 'nfp_acnc', name: 'ACNC charity registration', price: 1100, gov: true, note: 'ACNC application (no ACNC fee applies).' },
      { id: 'nfp_dgr', name: 'DGR application', price: 1500, gov: false, note: 'DGR endorsement application.' },
    ],
    addons: [
      { id: 'fbt', name: 'FBT return', price: 880, oneOff: false },
      { id: 'tpar', name: 'TPAR lodgement', price: 330, oneOff: false },
      { id: 'div7a', name: 'Division 7A work', price: 440, oneOff: false },
      { id: 'payroll_tax', name: 'Payroll tax', price: 660, oneOff: false },
      { id: 'workcover', name: 'WorkCover declaration', price: 220, oneOff: false },
      { id: 'cgt', name: 'Capital gains calculation', price: 330, oneOff: false },
      { id: 'hist_bas', name: 'Historical BAS / return', price: 180, oneOff: true },
      { id: 'ato_assist', name: 'ATO audit / payment-plan assistance', price: 1500, oneOff: true },
    ],
    addonsSMSF: [
      { id: 'smsf_actuarial', name: 'Actuarial certificate', price: 150, oneOff: false },
      { id: 'smsf_pension', name: 'Pension commencement documentation', price: 250, oneOff: true },
      { id: 'smsf_member', name: 'Additional fund member', price: 220, oneOff: false },
      { id: 'smsf_lrba', name: 'LRBA / borrowing administration', price: 440, oneOff: false },
      { id: 'smsf_contrib', name: 'Contribution caps & TSB review', price: 180, oneOff: false },
      { id: 'smsf_inhouse', name: 'In-house asset / compliance review', price: 300, oneOff: false },
      { id: 'smsf_software', name: 'Fund software migration / setup', price: 300, oneOff: true },
      { id: 'smsf_windup', name: 'SMSF wind-up / rollover', price: 900, oneOff: true },
    ],
    addonsNFP: [
      { id: 'nfp_ais', name: 'ACNC Annual Information Statement', price: 330, oneOff: false },
      { id: 'nfp_spfr', name: 'Special purpose financial report', price: 550, oneOff: false },
      { id: 'nfp_audit', name: 'Auditor liaison / audit facilitation', price: 300, oneOff: false },
      { id: 'nfp_grant', name: 'Grant acquittal report', price: 250, oneOff: false },
      { id: 'nfp_dgrrev', name: 'DGR status review', price: 300, oneOff: false },
      { id: 'nfp_fbt', name: 'FBT return (rebatable/exempt review)', price: 660, oneOff: false },
      { id: 'nfp_payroll', name: 'Payroll / STP compliance support', price: 330, oneOff: false },
      { id: 'nfp_giftfund', name: 'Public / gift fund review', price: 300, oneOff: false },
    ],
  };
}

function defaultQuotePadConfig() {
  return {
    firm: defaultFirm(),
    household: defaultHouseholdConfig(),
    business: defaultBusinessConfig(),
  };
}

module.exports = { defaultQuotePadConfig, defaultFirm, defaultHouseholdConfig, defaultBusinessConfig };
