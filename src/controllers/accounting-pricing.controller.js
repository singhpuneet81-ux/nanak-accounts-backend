/**
 * Accounting Pricing Controller
 * 
 * CRUD operations for dynamic pricing management across
 * Company Accounting, Trust Accounting, NFP Accounting, Partnership Tax
 */

const AccountingPricing = require("../models/accounting-pricing.model");
const seederData = require("../data/accountingPricingData");

/**
 * GET /api/admin/accounting-pricing
 * Public — returns all 4 service pricing configs
 */
exports.getAll = async (req, res) => {
  try {
    const data = await AccountingPricing.find({}).lean();

    // If DB is empty, return seeder data as fallback
    if (!data || data.length === 0) {
      return res.json({
        success: true,
        source: "fallback",
        data: seederData,
      });
    }

    return res.json({
      success: true,
      source: "database",
      data,
    });
  } catch (error) {
    console.error("Error fetching accounting pricing:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch accounting pricing",
    });
  }
};

/**
 * GET /api/admin/accounting-pricing/:serviceKey
 * Public — returns pricing for a specific service
 */
exports.getByServiceKey = async (req, res) => {
  try {
    const { serviceKey } = req.params;

    const validKeys = ["company_accounting", "trust_accounting", "nfp_accounting", "partnership_tax"];
    if (!validKeys.includes(serviceKey)) {
      return res.status(400).json({
        success: false,
        error: `Invalid serviceKey. Must be one of: ${validKeys.join(", ")}`,
      });
    }

    let data = await AccountingPricing.findOne({ serviceKey }).lean();

    // Fallback to seeder
    if (!data) {
      data = seederData.find((s) => s.serviceKey === serviceKey);
      if (!data) {
        return res.status(404).json({ success: false, error: "Service not found" });
      }
      return res.json({ success: true, source: "fallback", data });
    }

    return res.json({ success: true, source: "database", data });
  } catch (error) {
    console.error("Error fetching service pricing:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch service pricing",
    });
  }
};

/**
 * PUT /api/admin/accounting-pricing/:serviceKey
 * Admin only — updates pricing for a specific service
 */
exports.update = async (req, res) => {
  try {
    const { serviceKey } = req.params;
    const updateData = req.body;

    const validKeys = ["company_accounting", "trust_accounting", "nfp_accounting", "partnership_tax"];
    if (!validKeys.includes(serviceKey)) {
      return res.status(400).json({
        success: false,
        error: `Invalid serviceKey. Must be one of: ${validKeys.join(", ")}`,
      });
    }

    // Prevent changing serviceKey
    delete updateData.serviceKey;
    delete updateData._id;

    const data = await AccountingPricing.findOneAndUpdate(
      { serviceKey },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return res.json({
      success: true,
      message: `Pricing for ${serviceKey} updated successfully`,
      data,
    });
  } catch (error) {
    console.error("Error updating pricing:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update pricing",
    });
  }
};

/**
 * PUT /api/admin/accounting-pricing/:serviceKey/tiers
 * Admin only — updates ONLY the revenue tier pricing (compliance + monthly)
 * 
 * Body: { "under75k": { "compliance": 1200, "monthly": 100 }, ... }
 */
exports.updateTiers = async (req, res) => {
  try {
    const { serviceKey } = req.params;
    const tiers = req.body;

    const validKeys = ["company_accounting", "trust_accounting", "nfp_accounting", "partnership_tax"];
    if (!validKeys.includes(serviceKey)) {
      return res.status(400).json({ success: false, error: "Invalid serviceKey" });
    }

    const data = await AccountingPricing.findOneAndUpdate(
      { serviceKey },
      { $set: { tiers } },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return res.json({
      success: true,
      message: `Tier pricing for ${serviceKey} updated`,
      data,
    });
  } catch (error) {
    console.error("Error updating tiers:", error);
    return res.status(500).json({ success: false, error: "Failed to update tiers" });
  }
};

/**
 * PUT /api/admin/accounting-pricing/:serviceKey/addons
 * Admin only — updates addon pricing
 * 
 * Body: { "catchUpFee": 750, "registeredOfficeFee": 300, ... }
 */
exports.updateAddons = async (req, res) => {
  try {
    const { serviceKey } = req.params;
    const addons = req.body;

    const data = await AccountingPricing.findOneAndUpdate(
      { serviceKey },
      { $set: { addons } },
      { new: true, upsert: true }
    ).lean();

    return res.json({
      success: true,
      message: `Addon pricing for ${serviceKey} updated`,
      data,
    });
  } catch (error) {
    console.error("Error updating addons:", error);
    return res.status(500).json({ success: false, error: "Failed to update addons" });
  }
};

/**
 * POST /api/admin/accounting-pricing/seed
 * Admin only — seeds/resets all 4 services from seeder JSON
 */
exports.seed = async (req, res) => {
  try {
    const results = [];

    for (const service of seederData) {
      const result = await AccountingPricing.findOneAndUpdate(
        { serviceKey: service.serviceKey },
        { $set: service },
        { new: true, upsert: true, runValidators: true }
      );
      results.push({ serviceKey: service.serviceKey, status: "seeded" });
    }

    return res.json({
      success: true,
      message: "All accounting pricing seeded successfully",
      results,
    });
  } catch (error) {
    console.error("Error seeding accounting pricing:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to seed accounting pricing",
    });
  }
};

/**
 * DELETE /api/admin/accounting-pricing/:serviceKey
 * Admin only — resets a single service to seeder defaults
 */
exports.reset = async (req, res) => {
  try {
    const { serviceKey } = req.params;

    const seederEntry = seederData.find((s) => s.serviceKey === serviceKey);
    if (!seederEntry) {
      return res.status(404).json({ success: false, error: "Service not found in seeder" });
    }

    const data = await AccountingPricing.findOneAndUpdate(
      { serviceKey },
      { $set: seederEntry },
      { new: true, upsert: true }
    ).lean();

    return res.json({
      success: true,
      message: `${serviceKey} reset to defaults`,
      data,
    });
  } catch (error) {
    console.error("Error resetting pricing:", error);
    return res.status(500).json({ success: false, error: "Failed to reset pricing" });
  }
};
