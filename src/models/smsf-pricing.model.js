/**
 * SMSF Pricing Model (Mongoose)
 * 
 * Manages dynamic pricing for SMSF Accounting & Compliance.
 * Covers base annual fee, property rates, investment add-ons,
 * member fees, audit, strategy session, and display content.
 */

const mongoose = require("mongoose");

const investmentAddonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    sub: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const startDateSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    months: { type: Number, required: true },
    desc: { type: String, required: true },
  },
  { _id: false }
);

const propertyRatesSchema = new mongoose.Schema(
  {
    firstResidential: { type: Number, default: 500 },
    additionalResidential: { type: Number, default: 400 },
    commercial: { type: Number, default: 600 },
    lrba: { type: Number, default: 600 },
  },
  { _id: false }
);

const smsfPricingSchema = new mongoose.Schema(
  {
    serviceKey: {
      type: String,
      required: true,
      unique: true,
      default: "smsf_accounting",
      enum: ["smsf_accounting"],
    },
    label: { type: String, required: true, default: "SMSF Accounting" },
    baseAnnual: { type: Number, required: true, default: 1999 },
    propertyRates: { type: propertyRatesSchema, default: () => ({}) },
    investmentAddons: [investmentAddonSchema],
    extraMemberFee: { type: Number, default: 200 },
    pensionFee: { type: Number, default: 250 },
    auditFee: { type: Number, default: 450 },
    strategySessionFee: { type: Number, default: 500 },
    catchUpFee: { type: Number, default: 750 },
    startDates: [startDateSchema],
    baseFeatures: [{ type: String }],
    standardExtras: [{ type: String }],
    customScenarios: [{ type: String }],
    standardCardTitle: { type: String, default: "Standard SMSF" },
    standardCardSubtitle: { type: String, default: "1 property · Up to 2 members" },
    customCardTitle: { type: String, default: "Build Your Package" },
    customCardSubtitle: { type: String, default: "Customise for your fund" },
    disclaimerText: { type: String, default: "All prices exclude GST · Annual billing only · Independent audit from $450/yr" },
  },
  {
    timestamps: true,
    collection: "smsf_pricing",
  }
);

module.exports = mongoose.model("SMSFPricing", smsfPricingSchema);
