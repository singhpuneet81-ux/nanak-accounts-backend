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
  },
  plans: {
    essential: {
      title: "Essential",
      subtitle: "Compliance-focused",
      badge: null,
      features: [
        "Monthly Bookkeeping",
        "Quarterly BAS Lodgement",
        "Annual Tax Return",
        "Annual Financial Statements",
        "ASIC Annual Review"
      ],
      extraFeatures: [
        "Bank & Credit Card Reconciliation",
        "Cloud Accounting Software Setup",
        "Accounts Payable Tracking",
        "Accounts Receivable Tracking",
        "Company Tax Return Lodgement"
      ]
    },
    premium: {
      title: "Premium",
      subtitle: "Strategic growth",
      badge: "⭐ MOST POPULAR",
      features: [
        "Everything in Essential",
        "Tax Planning Sessions",
        "Priority Phone Support",
        "Monthly Management Reports",
        "Quarterly Strategy Meetings",
        "Dedicated Accountant"
      ],
      extraFeatures: [
        "ASIC Annual Review",
        "Accounts Payable Management",
        "Accounts Receivable Management",
        "Payroll Processing",
        "Annual Financial Statements",
        "Bank & Credit Card Reconciliation",
        "Company Tax Return Lodgement",
        "Cloud Accounting Software Setup",
        "Quarterly Review Meetings",
        "Strategic Tax Advisory"
      ]
    }
  },

  // ✅ NEW — Package Plans for "Choose Your Plan" cards
  packagePlans: {
    revenueBrackets: [
      { id: "under75k", label: "Under $75K" },
      { id: "75to200k", label: "$75K – $200K" },
      { id: "200to500k", label: "$200K – $500K" },
      { id: "500to1m", label: "$500K – $1M" },
      { id: "1mto2m", label: "$1M – $2M" },
      { id: "2mto5m", label: "$2M – $5M" }
    ],
    plans: [
      {
        id: "essential",
        name: "Essential",
        badge: "",
        tagline: "Compliance-focused",
        features: [
          "Monthly Bookkeeping",
          "Quarterly BAS Lodgement",
          "Annual Tax Return",
          "Annual Financial Statements",
          "ASIC Annual Review",
          "Bank & Credit Card Reconciliation",
          "Cloud Accounting Software Setup"
        ],
        tierPricing: {
          "under75k":  { standard: 1200, bundle: 840 },
          "75to200k":  { standard: 1400, bundle: 980 },
          "200to500k": { standard: 1600, bundle: 1120 },
          "500to1m":   { standard: 1800, bundle: 1260 },
          "1mto2m":    { standard: 2000, bundle: 1400 },
          "2mto5m":    { standard: 2500, bundle: 1750 }
        }
      },
      {
        id: "premium",
        name: "Premium",
        badge: "MOST POPULAR",
        tagline: "Strategic growth",
        features: [
          "Everything in Essential",
          "Tax Planning Sessions",
          "Priority Phone Support",
          "Monthly Management Reports",
          "Quarterly Strategy Meetings",
          "Dedicated Accountant"
        ],
        tierPricing: {
          "under75k":  { standard: 1800, bundle: 1260 },
          "75to200k":  { standard: 2100, bundle: 1470 },
          "200to500k": { standard: 2400, bundle: 1680 },
          "500to1m":   { standard: 2700, bundle: 1890 },
          "1mto2m":    { standard: 3000, bundle: 2100 },
          "2mto5m":    { standard: 3750, bundle: 2625 }
        }
      }
    ]
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
  disclaimerText: "All prices exclude GST · Annual billing only · Independent audit from $450/yr",

  // ✅ NEW
  packagePlans: {
    revenueBrackets: [
      { id: "under-200k", label: "Under $200K" },
      { id: "200k-500k", label: "$200K – $500K" },
      { id: "500k-1m", label: "$500K – $1M" },
      { id: "1m-2m", label: "$1M – $2M" },
      { id: "2m-5m", label: "$2M – $5M+" }
    ],
    plans: [
      {
        id: "standard",
        name: "Standard SMSF",
        badge: "",
        tagline: "1 property · Up to 2 members",
        features: [
          "Annual Financial Statements",
          "SMSF Tax Return Lodgement",
          "Member Statements",
          "Audit Liaison & Lodgement",
          "Trustee Minutes",
          "ATO Compliance"
        ],
        tierPricing: {
          "under-200k": { standard: 1999, bundle: 1599 },
          "200k-500k":  { standard: 2399, bundle: 1919 },
          "500k-1m":    { standard: 2799, bundle: 2239 },
          "1m-2m":      { standard: 3499, bundle: 2799 },
          "2m-5m":      { standard: 4499, bundle: 3599 }
        }
      },
      {
        id: "premium",
        name: "Premium SMSF",
        badge: "MOST POPULAR",
        tagline: "Full service · Strategy included",
        features: [
          "Everything in Standard",
          "Investment Strategy Review",
          "Pension Planning Support",
          "Rollover Processing",
          "Priority Phone Support",
          "Dedicated SMSF Accountant"
        ],
        tierPricing: {
          "under-200k": { standard: 2999, bundle: 2399 },
          "200k-500k":  { standard: 3599, bundle: 2879 },
          "500k-1m":    { standard: 4199, bundle: 3359 },
          "1m-2m":      { standard: 5249, bundle: 4199 },
          "2m-5m":      { standard: 6749, bundle: 5399 }
        }
      }
    ]
  }
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
  pageSubtitle: "Select all your income streams to get an accurate quote",

  // ✅ NEW
  packagePlans: {
    revenueBrackets: [
      { id: "0-50k", label: "Up to $50K" },
      { id: "50k-100k", label: "$50K – $100K" },
      { id: "100k-200k", label: "$100K – $200K" },
      { id: "200k-plus", label: "$200K+" }
    ],
    plans: [
      {
        id: "essential",
        name: "Essential",
        badge: "",
        tagline: "Standard tax return lodgement",
        features: [
          "Accurate tax return lodgement",
          "Standard deduction claims",
          "ATO pre-fill data review",
          "Email support"
        ],
        tierPricing: {
          "0-50k":     { standard: 99, bundle: 79 },
          "50k-100k":  { standard: 139, bundle: 111 },
          "100k-200k": { standard: 179, bundle: 143 },
          "200k-plus": { standard: 249, bundle: 199 }
        }
      },
      {
        id: "premium",
        name: "Premium",
        badge: "RECOMMENDED",
        tagline: "Tax planning included",
        features: [
          "All Essential features",
          "Tax planning consultation",
          "Priority phone support",
          "Dedicated accountant",
          "Deduction maximisation review"
        ],
        tierPricing: {
          "0-50k":     { standard: 149, bundle: 119 },
          "50k-100k":  { standard: 199, bundle: 159 },
          "100k-200k": { standard: 269, bundle: 215 },
          "200k-plus": { standard: 349, bundle: 279 }
        }
      }
    ]
  }
};

/* ===============================
   FINAL EXPORT
================================ */

module.exports = [
  ...tierServices,
  smsfService,
  soleTraderService
];
