/**
 * Sole Trader Tax Return Pricing Model (Mongoose)
 * 
 * Manages dynamic pricing for Sole Trader Tax Return service.
 * Covers income streams, ABN tiers, BAS pricing, discount rules,
 * plan features, and display content.
 */

const mongoose = require("mongoose");

const incomeStreamSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    desc: { type: String, required: true },
    basePrice: { type: Number, required: true },
    pricePrefix: { type: String, default: "" },
    priceSuffix: { type: String, default: "" },
    icon: { type: String, required: true },
    type: { type: String, enum: ["checkbox", "expandable", "counter", "sharecounter"], required: true },
  },
  { _id: false }
);

const planSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    features: [{ type: String }],
  },
  { _id: false }
);

const soleTraderPricingSchema = new mongoose.Schema(
  {
    serviceKey: {
      type: String,
      required: true,
      unique: true,
      default: "sole_trader_tax_return",
      enum: ["sole_trader_tax_return"],
    },
    label: { type: String, required: true, default: "Sole Trader Tax Return" },
    incomeStreams: [incomeStreamSchema],
    abnIncomeTiers: {
      type: Map,
      of: Number,
      default: { "0-50k": 40, "50k-100k": 40, "100k-200k": 40, "200k+": 40 },
    },
    abnGstSurcharge: { type: Number, default: 20 },
    basPrice: { type: Number, default: 75 },
    discountThreshold: { type: Number, default: 3 },
    discountPercent: { type: Number, default: 10 },
    premiumSurchargePerStream: { type: Number, default: 50 },
    plans: {
      essential: { type: planSchema, required: true },
      premium: { type: planSchema, required: true },
    },
    declarations: [{ type: String }],
    whatHappensNext: [
      {
        title: { type: String, required: true },
        desc: { type: String, required: true },
      },
    ],
    pageTitle: { type: String, default: "Build Your Perfect Package" },
    pageSubtitle: { type: String, default: "Select all your income streams to get an accurate quote" },
  },
  {
    timestamps: true,
    collection: "sole_trader_pricing",
  }
);

module.exports = mongoose.model("SoleTraderPricing", soleTraderPricingSchema);
