const mongoose = require("mongoose");

const BookkeepingTierSchema = new mongoose.Schema(
  {
    name: String,
    txn: String,
    rate: { type: Number, default: 0 },
    badge: { type: String, default: "" },
  },
  { _id: false }
);

const BookkeepingAddonSchema = new mongoose.Schema(
  {
    payroll: { type: Number, default: 0 },
    feeds: { type: Number, default: 0 },
    ias: { type: Number, default: 0 },
    jobtrack: { type: Number, default: 0 },
    catchup: { type: Number, default: 0 },
  },
  { _id: false }
);

const BookkeepingPlanFeatureSchema = new mongoose.Schema(
  {
    name: String,
    badge: { type: String, default: "" },
    features: [String],
  },
  { _id: false }
);

const BookkeepingPricingSchema = new mongoose.Schema(
  {
    serviceKey: { type: String, required: true, unique: true },
    label: { type: String, default: "Bookkeeping" },
    annualDiscount: { type: Number, default: 10 },
    software: { type: String, default: "Xero / MYOB" },
    enableStrikePricing: { type: Boolean, default: true },
    tiers: [BookkeepingTierSchema],
    addonPrices: { type: BookkeepingAddonSchema, default: () => ({}) },
    planFeatures: [BookkeepingPlanFeatureSchema],
  },
  { timestamps: true }
);

const BookkeepingPricing = mongoose.model("BookkeepingPricing", BookkeepingPricingSchema);
module.exports = BookkeepingPricing;