

// const PayrollPricing = require("../models/PayrollPricing.model");

const PAYROLL_DEFAULTS = {
  serviceKey: "payroll",
  label: "Payroll",
  annualDiscount: 10,
  noticePeriod: "1 month",
  enableStrikePricing: true,
  showSaveBadge: true,
  tiers: [
    { name: "Micro", band: "1–4", rate: 110 },
    { name: "Small", band: "5–10", rate: 198 },
    { name: "Medium", band: "11–20", rate: 330 },
    { name: "Large", band: "21–50", rate: 550 },
    { name: "Enterprise", band: "50+", rate: 880 },
  ],
  addonPrices: {
    weekly: 55,
    extraEmp: 11,
    paydaysuper: 27.5,
    termination: 82.5,
    backpay: 55,
    healthcheck: 165,
  },
  planFeatures: [
    {
      name: "Standard",
      badge: "Base",
      features: [
        { text: "Payslip generation", type: "std" },
        { text: "STP lodgement", type: "std" },
        { text: "Super processing", type: "std" },
        { text: "Leave tracking", type: "std" },
        { text: "Award interpretation", type: "hi" },
      ],
    },
    {
      name: "Compliance+",
      badge: "Popular",
      features: [
        { text: "Everything in Standard", type: "std" },
        { text: "Fair Work compliance", type: "comp" },
        { text: "Termination processing", type: "comp" },
        { text: "Workers comp reporting", type: "hi" },
        { text: "Payroll tax lodgement", type: "comp" },
        { text: "Dedicated payroll officer", type: "hi" },
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
