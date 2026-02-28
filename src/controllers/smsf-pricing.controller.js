/**
 * SMSF Pricing Controller
 * 
 * CRUD operations for SMSF Accounting dynamic pricing
 */


const SMSFPricing = require("../models/smsf-pricing.model");
const allPricingData = require("../data/accountingPricingData");

// Extract SMSF config from master pricing file
const seederData = allPricingData.find(
  s => s.serviceKey === "smsf_accounting"
);

/**
 * GET /api/admin/smsf-pricing
 * Public — returns SMSF pricing config
 */
exports.get = async (req, res) => {
  try {
    let data = await SMSFPricing.findOne({ serviceKey: "smsf_accounting" }).lean();
    if (!data) {
      return res.json({ success: true, source: "fallback", data: seederData });
    }
    return res.json({ success: true, source: "database", data });
  } catch (error) {
    console.error("Error fetching SMSF pricing:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch SMSF pricing" });
  }
};

/**
 * PUT /api/admin/smsf-pricing
 * Admin only — updates SMSF pricing config
 */
exports.update = async (req, res) => {
  try {
    const updateData = req.body;
    delete updateData.serviceKey;
    delete updateData._id;

    const data = await SMSFPricing.findOneAndUpdate(
      { serviceKey: "smsf_accounting" },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return res.json({ success: true, message: "SMSF pricing updated successfully", data });
  } catch (error) {
    console.error("Error updating SMSF pricing:", error);
    return res.status(500).json({ success: false, error: "Failed to update SMSF pricing" });
  }
};

/**
 * PUT /api/admin/smsf-pricing/property-rates
 * Admin only — updates property rate pricing only
 */
exports.updatePropertyRates = async (req, res) => {
  try {
    const data = await SMSFPricing.findOneAndUpdate(
      { serviceKey: "smsf_accounting" },
      { $set: { propertyRates: req.body } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return res.json({ success: true, message: "Property rates updated", data });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to update property rates" });
  }
};

/**
 * PUT /api/admin/smsf-pricing/investment-addons
 * Admin only — updates investment add-on pricing
 */
exports.updateInvestmentAddons = async (req, res) => {
  try {
    const data = await SMSFPricing.findOneAndUpdate(
      { serviceKey: "smsf_accounting" },
      { $set: { investmentAddons: req.body } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return res.json({ success: true, message: "Investment addons updated", data });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to update investment addons" });
  }
};

/**
 * POST /api/admin/smsf-pricing/seed
 * Admin only — seeds/resets from seeder JSON
 */
exports.seed = async (req, res) => {
  try {
    const data = await SMSFPricing.findOneAndUpdate(
      { serviceKey: "smsf_accounting" },
      { $set: seederData },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return res.json({ success: true, message: "SMSF pricing seeded successfully", data });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to seed SMSF pricing" });
  }
};

/**
 * DELETE /api/admin/smsf-pricing
 * Admin only — resets to seeder defaults
 */
exports.reset = async (req, res) => {
  try {
    const data = await SMSFPricing.findOneAndUpdate(
      { serviceKey: "smsf_accounting" },
      { $set: seederData },
      { new: true, upsert: true }
    ).lean();
    return res.json({ success: true, message: "SMSF pricing reset to defaults", data });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to reset SMSF pricing" });
  }
};
