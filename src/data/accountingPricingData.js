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
      features: [
        "Monthly Bookkeeping",
        "Quarterly BAS Lodgement",
        "Annual Tax Return",
        "Annual Financial Statements",
        "ASIC Annual Review"
      ],
      extraFeatures: [
        "Accounts Payable Management",
        "Accounts Receivable Management",
        "Payroll Processing",
        "Bank & Credit Card Reconciliation",
        "Company Tax Return Lodgement"
      ]
    },
    premium: {
      title: "Premium",
      subtitle: "Strategic growth",
      badge: "MOST POPULAR",
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
  }
};

const services = [
  { serviceKey: "company_accounting", label: "Company Accounting" },
  { serviceKey: "trust_accounting", label: "Trust Accounting" },
  { serviceKey: "nfp_accounting", label: "NFP Accounting" },
  { serviceKey: "partnership_tax", label: "Partnership Tax" }
];

module.exports = services.map(service => ({
  ...baseConfig,
  ...service
}));