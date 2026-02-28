/* ===============================
   SHARED TIER-BASED CONFIG
================================ */

const baseConfig = {
  tiers: {
    under75k: { compliance: 1200, monthly: 100 },
    "75to200k": { compliance: 1400, monthly: 120 },
    "200to500k": { compliance: 1600, monthly: 140 },
    "500to1m": { compliance: 1800, monthly: 160 },
    "1mto2m": { compliance: 2000, monthly: 180 },
    "2mto5m": { compliance: 2500, monthly: 200 }
  },
  revenueTiers: [
    { id: "under75k", label: "Under $75K" },
    { id: "75to200k", label: "$75K – $200K" },
    { id: "200to500k", label: "$200K – $500K" },
    { id: "500to1m", label: "$500K – $1M" },
    { id: "1mto2m", label: "$1M – $2M" },
    { id: "2mto5m", label: "$2M – $5M" }
  ],
  annualDiscount: 0.2,
  transitionFee: 600,
  startDates: [
    { id: "jul", label: "1 July 2025", months: 12, desc: "Full Year" },
    { id: "oct", label: "1 October 2025", months: 9, desc: "9 months" },
    { id: "jan", label: "1 January 2026", months: 6, desc: "6 months" },
    { id: "apr", label: "1 April 2026", months: 3, desc: "3 months" }
  ],
  addons: {
    catchUpFee: 750,
    registeredOfficeFee: 300,
    taxPlanningFee: 500,
    payrollPerEmployee: 120
  }
};

/* ===============================
   TIER-BASED SERVICES
================================ */

const tierServices = [
  { serviceKey: "company_accounting", label: "Company Accounting" },
  { serviceKey: "trust_accounting", label: "Trust Accounting" },
  { serviceKey: "nfp_accounting", label: "NFP Accounting" },
  { serviceKey: "partnership_tax", label: "Partnership Tax" }
].map(service => ({
  ...baseConfig,
  ...service
}));

/* ===============================
   SMSF ACCOUNTING
================================ */

const smsfService = {
  serviceKey: "smsf_accounting",
  label: "SMSF Accounting",
  baseAnnual: 1999,
  propertyRates: {
    firstResidential: 500,
    additionalResidential: 400,
    commercial: 600,
    lrba: 600
  },
  investmentAddons: [
    { id: "high_volume_trading", label: "High Volume Trading", sub: "Active share trading portfolio", price: 250 },
    { id: "unlisted_investments", label: "Unlisted Investments", sub: "Private company shares, unlisted trusts", price: 300 },
    { id: "overseas_investments", label: "Overseas Investments", sub: "International shares, foreign assets", price: 300 },
    { id: "cryptocurrency", label: "Cryptocurrency", sub: "Bitcoin, Ethereum & other digital assets", price: 350 }
  ],
  extraMemberFee: 200,
  pensionFee: 250,
  auditFee: 450,
  strategySessionFee: 500,
  catchUpFee: 750,
  startDates: baseConfig.startDates,
  baseFeatures: [
    "Annual Financial Statements",
    "SMSF Tax Return Lodgement",
    "Member Statements",
    "Audit Liaison & Lodgement",
    "Trustee Minutes",
    "Pension Documentation",
    "ATO Compliance",
    "Class Super Platform"
  ],
  standardExtras: [
    "1 Residential Property included",
    "Up to 2 members",
    "Listed shares & managed funds"
  ],
  customScenarios: [
    "Multiple residential properties",
    "Commercial properties",
    "LRBA (Limited Recourse Borrowing)",
    "Crypto, overseas or unlisted investments",
    "3+ fund members",
    "Pension phase members"
  ],
  standardCardTitle: "Standard SMSF",
  standardCardSubtitle: "1 property · Up to 2 members",
  customCardTitle: "Build Your Package",
  customCardSubtitle: "Customise for your fund",
  disclaimerText: "All prices exclude GST · Annual billing only · Independent audit from $450/yr"
};

/* ===============================
   SOLE TRADER TAX RETURN
================================ */

const soleTraderService = {
  serviceKey: "sole_trader_tax_return",
  label: "Sole Trader Tax Return",
  incomeStreams: [
    { id: "tfn", label: "TFN Income (PAYG Employment)", desc: "Salary, wages, government payments", basePrice: 99, icon: "User", type: "checkbox" },
    { id: "abn", label: "ABN Income (Sole Trader / Business)", desc: "Self-employed income, Uber, freelancing", basePrice: 40, pricePrefix: "From ", icon: "Building2", type: "expandable" },
    { id: "rental", label: "Rental Properties", desc: "Investment properties with rental income", basePrice: 50, priceSuffix: " each", icon: "Home", type: "counter" },
    { id: "crypto", label: "Cryptocurrency Capital Gains Schedule", desc: "Crypto trading, DeFi, staking, NFTs", basePrice: 100, icon: "Bitcoin", type: "checkbox" },
    { id: "shares", label: "Shares & Investments", desc: "Share trading, dividends (Comsec, NABSec), capital gains", basePrice: 10, priceSuffix: "/share sold", icon: "TrendingUp", type: "sharecounter" },
    { id: "cgt_property", label: "Capital Gain Tax Property Sale", desc: "Capital gains tax calculation on property sales", basePrice: 250, icon: "Landmark", type: "checkbox" },
    { id: "cfds", label: "CFDs (Contracts for Difference)", desc: "CFD trading tax calculations and reporting", basePrice: 100, icon: "CandlestickChart", type: "checkbox" },
    { id: "foreign_income", label: "Foreign Income / Overseas Assets", desc: "Foreign employment, overseas investments, rental abroad", basePrice: 100, icon: "Globe", type: "checkbox" }
  ],
  abnIncomeTiers: {
    "0-50k": 40,
    "50k-100k": 40,
    "100k-200k": 40,
    "200k+": 40
  },
  abnGstSurcharge: 20,
  basPrice: 75,
  discountThreshold: 3,
  discountPercent: 10,
  premiumSurchargePerStream: 50,
  plans: {
    essential: {
      title: "Essential",
      features: [
        "Accurate tax return lodgement",
        "Standard deduction claims",
        "Email support"
      ]
    },
    premium: {
      title: "Premium",
      features: [
        "All Essential features",
        "Tax planning consultation",
        "Priority phone support",
        "Dedicated accountant"
      ]
    }
  },
  declarations: [
    "The information I have provided is true and correct",
    "I authorize Nanak Accountants & Associates to access my ATO records using my TFN",
    "I understand a registered tax accountant will prepare and lodge my tax return",
    "I agree to review and sign the draft return before lodgement",
    "I have read and agree to the Terms of Service and Privacy Policy"
  ],
  whatHappensNext: [
    { title: "Accountant Contact", desc: "Registered accountant contacts you in 24-48hrs" },
    { title: "ATO Data Prefill", desc: "All income & tax info pulled from ATO automatically" },
    { title: "Draft Preparation", desc: "Your return prepared with maximum deductions" },
    { title: "Review & Sign", desc: "Review draft and sign online securely" },
    { title: "Lodge & Confirm", desc: "Lodged to ATO + confirmation sent to you" }
  ],
  pageTitle: "Build Your Perfect Package",
  pageSubtitle: "Select all your income streams to get an accurate quote"
};

/* ===============================
   FINAL EXPORT
================================ */

module.exports = [
  ...tierServices,
  smsfService,
  soleTraderService
];