const PayrollPricing = require("../models/PayrollPricing.model");

const PAYROLL_DEFAULTS = {
  serviceKey: "payroll",
  label: "Payroll Services",
  annualDiscount: 20,
  noticePeriod: "1 month",
  enableStrikePricing: true,
  showSaveBadge: true,
  tiers: [
    { name: "Essentials", band: "1–5", rate: 99 },
    { name: "Growth", band: "6–20", rate: 199 },
    { name: "Enterprise", band: "21–50", rate: 349 },
  ],
  addonPrices: {
    weekly: 50,
    extraEmp: 8,
    paydaysuper: 299,
    termination: 150,
    backpay: 199,
    healthcheck: 350,
  },
  planFeatures: [
    {
      name: "Standard",
      badge: "",
      features: [
        { text: "STP Phase 2 lodgement every pay run", type: "std" },
        { text: "Super processing at 12% SG", type: "std" },
        { text: "PAYG withholding calculation", type: "std" },
        { text: "Payslips & leave tracking", type: "std" },
        { text: "Year-end finalisation (EOFY)", type: "comp" },
        { text: "Payday Super ready (July 2026)", type: "hi" },
      ],
    },
    {
      name: "Premium",
      badge: "MOST POPULAR",
      features: [
        { text: "Everything in Standard", type: "hi" },
        { text: "Award interpretation & penalty rates", type: "std" },
        { text: "Overtime & shift loading calculations", type: "std" },
        { text: "Allowances & reimbursements", type: "comp" },
        { text: "Super clearing house management", type: "comp" },
        { text: "Dedicated payroll specialist", type: "hi" },
      ],
    },
  ],
};

const payrollSeed = async (req, res) => {
  try {
    await PayrollPricing.deleteMany({});
    const doc = await PayrollPricing.create(PAYROLL_DEFAULTS);
    res.json({ success: true, message: "Payroll pricing seeded", data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  seed: payrollSeed,
};
