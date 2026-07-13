const { asyncHandler } = require('../../middleware/asyncHandler');
const industryService = require('./industry.service');

const list = asyncHandler(async (req, res) => {
  const data = await industryService.listIndustries(req.query);
  res.json({ success: true, ...data });
});

const search = asyncHandler(async (req, res) => {
  const data = await industryService.listIndustries({
    ...req.query,
    search: req.query.q || req.query.search,
  });
  res.json({ success: true, ...data });
});

const byCategory = asyncHandler(async (req, res) => {
  const category = req.params.category;
  const data = await industryService.listIndustries({ ...req.query, category });
  res.json({ success: true, ...data });
});

const verified = asyncHandler(async (req, res) => {
  const data = await industryService.listIndustries({ ...req.query, verified: 'true', filter: 'verified' });
  res.json({ success: true, ...data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await industryService.getIndustryById(req.params.id);
  res.json({ success: true, ...data });
});

const create = asyncHandler(async (req, res) => {
  const industry = await industryService.createIndustry(req.body, req.user);
  res.status(201).json({ success: true, industry });
});

const update = asyncHandler(async (req, res) => {
  const industry = await industryService.updateIndustry(req.params.id, req.body, req.user);
  res.json({ success: true, industry });
});

const remove = asyncHandler(async (req, res) => {
  await industryService.deleteIndustry(req.params.id, req.user);
  res.json({ success: true, message: 'Industry archived' });
});

const clone = asyncHandler(async (req, res) => {
  const industry = await industryService.cloneIndustry(req.params.id, req.body.name, req.user);
  res.status(201).json({ success: true, industry });
});

const publish = asyncHandler(async (req, res) => {
  const industry = await industryService.publishIndustry(req.params.id, req.user);
  res.json({ success: true, industry });
});

const verify = asyncHandler(async (req, res) => {
  const industry = await industryService.verifyIndustry(req.params.id, !!req.body.publish, req.user);
  res.json({ success: true, industry });
});

module.exports = {
  list,
  search,
  byCategory,
  verified,
  getOne,
  create,
  update,
  remove,
  clone,
  publish,
  verify,
};
