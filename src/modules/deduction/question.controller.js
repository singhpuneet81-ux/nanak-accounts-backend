const { asyncHandler } = require('../../middleware/asyncHandler');
const questionService = require('./question.service');

const list = asyncHandler(async (req, res) => {
  const data = await questionService.listQuestions(req.query);
  res.json({ success: true, ...data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await questionService.getQuestion(req.params.id);
  res.json({ success: true, ...data });
});

const create = asyncHandler(async (req, res) => {
  const question = await questionService.createQuestion(req.body, req.user);
  res.status(201).json({ success: true, question });
});

const update = asyncHandler(async (req, res) => {
  const question = await questionService.updateQuestion(req.params.id, req.body, req.user);
  res.json({ success: true, question });
});

const duplicate = asyncHandler(async (req, res) => {
  const question = await questionService.duplicateQuestion(req.params.id, req.user);
  res.status(201).json({ success: true, question });
});

const remove = asyncHandler(async (req, res) => {
  const data = await questionService.deleteQuestion(req.params.id);
  res.json({ success: true, ...data });
});

const importPreview = asyncHandler(async (req, res) => {
  const data = questionService.previewImport(req.body?.format || req.query.format);
  res.json({ success: true, ...data });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  duplicate,
  remove,
  importPreview,
};
