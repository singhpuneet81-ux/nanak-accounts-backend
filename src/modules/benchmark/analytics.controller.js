const { asyncHandler } = require('../../middleware/asyncHandler');
const analyticsService = require('./analytics.service');

const dashboard = asyncHandler(async (_req, res) => {
  const data = await analyticsService.getDashboard();
  res.json({ success: true, ...data });
});

const monthly = asyncHandler(async (_req, res) => {
  const monthly = await analyticsService.getMonthly();
  res.json({ success: true, monthly });
});

const risk = asyncHandler(async (_req, res) => {
  const risk = await analyticsService.getRiskAnalytics();
  res.json({ success: true, risk });
});

const categories = asyncHandler(async (_req, res) => {
  const categories = await analyticsService.getCategoryAnalytics();
  res.json({ success: true, categories });
});

const industries = asyncHandler(async (_req, res) => {
  const analytics = await analyticsService.getIndustryAnalytics();
  res.json({ success: true, analytics });
});

module.exports = { dashboard, monthly, risk, categories, industries };
