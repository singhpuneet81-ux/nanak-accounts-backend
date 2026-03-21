
const mongoose = require("mongoose");

const PayrollTierSchema = new mongoose.Schema(
  {
    name: String,
    band: String,
    rate: { type: Number, default: 0 },
  },
  { _id: false }
);

const PayrollAddonSchema = new mongoose.Schema(
  {
    weekly: { type: Number, default: 0 },
    extraEmp: { type: Number, default: 0 },
    paydaysuper: { type: Number, default: 0 },
    termination: { type: Number, default: 0 },
    backpay: { type: Number, default: 0 },
    healthcheck: { type: Number, default: 0 },
  },
  { _id: false }
);

const PayrollPlanFeatureSchema = new mongoose.Schema(
  {
    text: String,
    type: { type: String, enum: ["std", "hi", "comp"], default: "std" },
  },
  { _id: false }
);

const PayrollPlanSchema = new mongoose.Schema(
  {
    name: String,
    badge: { type: String, default: "" },
    features: [PayrollPlanFeatureSchema],
  },
  { _id: false }
);

const PayrollPricingSchema = new mongoose.Schema(
  {
    serviceKey: { type: String, required: true, unique: true },
    label: { type: String, default: "Payroll" },
    annualDiscount: { type: Number, default: 10 },
    noticePeriod: { type: String, default: "1 month" },
    enableStrikePricing: { type: Boolean, default: true },
    showSaveBadge: { type: Boolean, default: true },
    tiers: [PayrollTierSchema],
    addonPrices: { type: PayrollAddonSchema, default: () => ({}) },
    planFeatures: [PayrollPlanSchema],
  },
  { timestamps: true }
);

const PayrollPricing = mongoose.model("PayrollPricing", PayrollPricingSchema);

module.exports = PayrollPricing;