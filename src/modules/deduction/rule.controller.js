const { asyncHandler } = require('../../middleware/asyncHandler');
const ruleService = require('./rule.service');

const list = asyncHandler(async (req, res) => {
  const data = await ruleService.listRules(req.query);
  res.json({ success: true, ...data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await ruleService.getRule(req.params.id);
  res.json({ success: true, ...data });
});

const create = asyncHandler(async (req, res) => {
  const rule = await ruleService.createRule(req.body, req.user);
  res.status(201).json({ success: true, rule });
});

const update = asyncHandler(async (req, res) => {
  const rule = await ruleService.updateRule(req.params.id, req.body, req.user);
  res.json({ success: true, rule });
});

const remove = asyncHandler(async (req, res) => {
  const data = await ruleService.deleteRule(req.params.id);
  res.json({ success: true, ...data });
});

const importPreview = asyncHandler(async (req, res) => {
  const data = ruleService.previewImport(req.body?.format || req.query.format);
  res.json({ success: true, ...data });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  importPreview,
};
