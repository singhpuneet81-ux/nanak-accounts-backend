const BookkeepingPricing = require("../models/BookkeepingPricing.model");

const BOOKKEEPING_DEFAULTS = {
  serviceKey: "bookkeeping",
  label: "Bookkeeping Services",
  annualDiscount: 20,
  software: "QuickBooks Online",
  enableStrikePricing: true,
  tiers: [
    { name: "Starter", txn: "Up to 75 txns/mo", rate: 150, badge: "" },
    {
      name: "Growth",
      txn: "Up to 200 txns/mo",
      rate: 280,
      badge: "MOST POPULAR",
    },
    { name: "Scale", txn: "Up to 500 txns/mo", rate: 480, badge: "" },
  ],
  addonPrices: {
    payroll: 25,
    feeds: 20,
    ias: 50,
    jobtrack: 40,
    catchup: 299,
  },
  planFeatures: [
    {
      name: "Starter",
      badge: "",
      features: [
        "Monthly bookkeeping",
        "1 bank / card feed",
        "BAS preparation & lodgement",
        "QuickBooks Online included",
        "Monthly reconciliation",
        "Email support",
      ],
    },
    {
      name: "Growth",
      badge: "MOST POPULAR",
      features: [
        "Everything in Starter",
        "Up to 3 bank / card feeds",
        "Monthly P&L & balance sheet",
        "Accounts payable & receivable",
        "Fortnightly reconciliation",
        "Priority support",
      ],
    },
    {
      name: "Scale",
      badge: "",
      features: [
        "Everything in Growth",
        "Unlimited bank feeds",
        "Weekly reconciliation",
        "Cash flow forecasting",
        "Dedicated bookkeeper",
        "Phone & video support",
      ],
    },
  ],
};

const bookkeepingSeed = async (req, res) => {
  try {
    await BookkeepingPricing.deleteMany({});
    const doc = await BookkeepingPricing.create(BOOKKEEPING_DEFAULTS);
    res.json({
      success: true,
      message: "Bookkeeping pricing seeded",
      data: doc,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
module.exports = {
  seed: bookkeepingSeed,
};
