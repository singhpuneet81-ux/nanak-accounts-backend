  /**
   * Accounting Pricing Model (Mongoose)
   * 
   * Manages dynamic pricing for:
   * - Company Accounting
   * - Trust Accounting
   * - NFP Accounting
   * - Partnership Tax
   */

  const mongoose = require("mongoose");

  const tierPricingSchema = new mongoose.Schema(
    {
      compliance: { type: Number, required: true },
      monthly: { type: Number, required: true },
      strikeCompliance: { type: Number, default: null },
      strikeMonthly: { type: Number, default: null },
    },
    { _id: false }
  );

  const revenueTierSchema = new mongoose.Schema(
    {
      id: { type: String, required: true },
      label: { type: String, required: true },
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

  const planSchema = new mongoose.Schema(
    {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      badge: { type: String, default: null },
      features: [{ type: String }],
      extraFeatures: [{ type: String }],
    },
    { _id: false }
  );

  const addonsSchema = new mongoose.Schema(
    {
      catchUpFee: { type: Number, default: 750 },
      registeredOfficeFee: { type: Number, default: 300 },
      taxPlanningFee: { type: Number, default: 500 },
      payrollPerEmployee: { type: Number, default: 120 },
    },
    { _id: false }
  );

  const accountingPricingSchema = new mongoose.Schema(
    {
      serviceKey: {
        type: String,
        required: true,
        unique: true,
        enum: ["company_accounting", "trust_accounting", "nfp_accounting", "partnership_tax", "sole_trader_accounting", "smsf_accounting","sole_trader_tax_return"],
      },
      label: { type: String, required: true },
      tiers: {
        type: Map,
        of: tierPricingSchema,
        required: true,
      },
      revenueTiers: [revenueTierSchema],
      annualDiscount: { type: Number, default: 0.2 },
      transitionFee: { type: Number, default: 600 },
      startDates: [startDateSchema],
      addons: { type: addonsSchema, default: () => ({}) },
      enableStrikePricing: { type: Boolean, default: false },
      plans: {
        essential: { type: planSchema, required: true },
        premium: { type: planSchema, required: true },
      },
    },
    {
       strict: false,
      timestamps: true,
      collection: "accounting_pricing",
    }
  );

  module.exports = mongoose.model("AccountingPricing", accountingPricingSchema);
