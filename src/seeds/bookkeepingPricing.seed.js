
const BookkeepingPricing = require("../models/BookkeepingPricing.model");

const BOOKKEEPING_DEFAULTS = {
  serviceKey: "bookkeeping",
  label: "Bookkeeping",
  annualDiscount: 10,
  software: "Xero / MYOB",
  enableStrikePricing: true,
  tiers: [
    { name: "Small", txn: "0–50", rate: 220, badge: "Starter" },
    { name: "Medium", txn: "51–150", rate: 385, badge: "Popular" },
    { name: "Large", txn: "151–300", rate: 550, badge: "" },
    { name: "Enterprise", txn: "301–500", rate: 770, badge: "Custom" },
    { name: "Corporate", txn: "500+", rate: 990, badge: "" },
  ],
  addonPrices: {
    payroll: 55,
    feeds: 27.5,
    ias: 110,
    jobtrack: 82.5,
    catchup: 165,
  },
  planFeatures: [
    {
      name: "Essential",
      badge: "Base",
      features: [
        "Monthly reconciliation",
        "BAS preparation",
        "Bank feed management",
        "Quarterly review call",
      ],
    },
    {
      name: "Premium",
      badge: "Popular",
      features: [
        "Everything in Essential",
        "Payroll processing",
        "Accounts payable/receivable",
        "Monthly reporting pack",
        "Dedicated bookkeeper",
      ],
    },
    {
      name: "Ultimate",
      badge: "Best Value",
      features: [
        "Everything in Premium",
        "Job tracking & costing",
        "Inventory management",
        "Weekly reconciliation",
        "Priority support",
        "CFO-level insights",
      ],
    },
  ],
};

const bookkeepingSeed = async (req, res) => {
  try {
    await BookkeepingPricing.deleteMany({});
    const doc = await BookkeepingPricing.create(BOOKKEEPING_DEFAULTS);
    res.json({ success: true, message: "Bookkeeping pricing seeded", data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};