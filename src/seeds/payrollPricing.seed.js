const PayrollPricing = require("../models/PayrollPricing.model");

const PAYROLL_DEFAULTS = {
  serviceKey: "payroll",
  label: "Payroll Services",
  annualDiscount: 0.2,
  noticePeriod: "1 month",
  enableStrikePricing: true,
  showSaveBadge: true,
  tiers: [
    { name: "Starter", band: "1–5 employees", rate: 120 },
    { name: "Growth", band: "6–10 employees", rate: 200 },
    { name: "Scale", band: "11–20 employees", rate: 350 },
    { name: "Enterprise", band: "21–50 employees", rate: 600 },
  ],
  addonPrices: {
    weekly: 30,
    extraEmp: 15,
    paydaysuper: 99,
    termination: 75,
    backpay: 299,
    healthcheck: 199,
  },
  planFeatures: [
    {
      name: "Standard",
      badge: "",
      features: [
        { text: "STP lodgement each pay run", type: "std" },
        { text: "Award interpretation", type: "std" },
        { text: "Payslip generation", type: "std" },
        { text: "Super guarantee processing", type: "comp" },
        { text: "Email support", type: "std" },
      ],
    },
    {
      name: "Premium",
      badge: "MOST POPULAR",
      features: [
        { text: "Everything in Standard", type: "hi" },
        { text: "Leave management & accruals", type: "std" },
        { text: "Termination & ETP calculations", type: "comp" },
        { text: "Payday Super compliance", type: "comp" },
        { text: "Priority phone & video support", type: "hi" },
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
