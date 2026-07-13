const { asyncHandler } = require('../../middleware/asyncHandler');
const occupationService = require('./occupation.service');

const list = asyncHandler(async (req, res) => {
  const data = await occupationService.listOccupations(req.query);
  res.json({ success: true, ...data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await occupationService.getOccupationDetail(req.params.id, req.query.financialYear);
  res.json({ success: true, ...data });
});

const create = asyncHandler(async (req, res) => {
  const occupation = await occupationService.createOccupation(req.body, req.user);
  res.status(201).json({ success: true, occupation });
});

const update = asyncHandler(async (req, res) => {
  const occupation = await occupationService.updateOccupation(req.params.id, req.body, req.user);
  res.json({ success: true, occupation });
});

const clone = asyncHandler(async (req, res) => {
  const occupation = await occupationService.cloneOccupation(
    req.params.id,
    req.body.name,
    req.user
  );
  res.status(201).json({ success: true, occupation });
});

const archive = asyncHandler(async (req, res) => {
  const occupation = await occupationService.archiveOccupation(req.params.id, req.user);
  res.json({ success: true, occupation });
});

const remove = asyncHandler(async (req, res) => {
  const data = await occupationService.deleteOccupation(req.params.id);
  res.json({ success: true, ...data });
});

const history = asyncHandler(async (req, res) => {
  const data = await occupationService.getOccupationHistory(req.params.id);
  res.json({ success: true, ...data });
});

const questions = asyncHandler(async (req, res) => {
  const data = await occupationService.getOccupationQuestions(
    req.params.id,
    req.query.financialYear
  );
  res.json({ success: true, ...data });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  clone,
  archive,
  remove,
  history,
  questions,
};
