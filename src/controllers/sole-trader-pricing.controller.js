/**
 * Sole Trader Pricing Controller
 * 
 * CRUD operations for Sole Trader Tax Return dynamic pricing
 */

const SoleTraderPricing = require("../models/sole-trader-pricing.model");
const seederData = require("../seeders/sole-trader-pricing-seeder.json");

/**
 * GET /api/admin/sole-trader-pricing
 * Public — returns Sole Trader pricing config
 */
exports.get = async (req, res) => {
  try {
    let data = await SoleTraderPricing.findOne({ serviceKey: "sole_trader_tax_return" }).lean();
    if (!data) {
      return res.json({ success: true, source: "fallback", data: seederData });
    }
    return res.json({ success: true, source: "database", data });
  } catch (error) {
    console.error("Error fetching sole trader pricing:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch sole trader pricing" });
  }
};

/**
 * PUT /api/admin/sole-trader-pricing
 * Admin only — updates full config
 */
exports.update = async (req, res) => {
  try {
    const updateData = req.body;
    delete updateData.serviceKey;
    delete updateData._id;

    const data = await SoleTraderPricing.findOneAndUpdate(
      { serviceKey: "sole_trader_tax_return" },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return res.json({ success: true, message: "Sole trader pricing updated", data });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to update sole trader pricing" });
  }
};

/**
 * PUT /api/admin/sole-trader-pricing/streams
 * Admin only — updates income stream pricing only
 */
exports.updateStreams = async (req, res) => {
  try {
    const data = await SoleTraderPricing.findOneAndUpdate(
      { serviceKey: "sole_trader_tax_return" },
      { $set: { incomeStreams: req.body } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return res.json({ success: true, message: "Income streams updated", data });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to update income streams" });
  }
};

/**
 * PUT /api/admin/sole-trader-pricing/plans
 * Admin only — updates plan features/titles
 */
exports.updatePlans = async (req, res) => {
  try {
    const data = await SoleTraderPricing.findOneAndUpdate(
      { serviceKey: "sole_trader_tax_return" },
      { $set: { plans: req.body } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return res.json({ success: true, message: "Plans updated", data });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to update plans" });
  }
};

/**
 * POST /api/admin/sole-trader-pricing/seed
 * Admin only — seeds from JSON
 */
exports.seed = async (req, res) => {
  try {
    const data = await SoleTraderPricing.findOneAndUpdate(
      { serviceKey: "sole_trader_tax_return" },
      { $set: seederData },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return res.json({ success: true, message: "Sole trader pricing seeded", data });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to seed sole trader pricing" });
  }
};

/**
 * DELETE /api/admin/sole-trader-pricing
 * Admin only — resets to defaults
 */
exports.reset = async (req, res) => {
  try {
    const data = await SoleTraderPricing.findOneAndUpdate(
      { serviceKey: "sole_trader_tax_return" },
      { $set: seederData },
      { new: true, upsert: true }
    ).lean();
    return res.json({ success: true, message: "Sole trader pricing reset to defaults", data });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to reset sole trader pricing" });
  }
};
