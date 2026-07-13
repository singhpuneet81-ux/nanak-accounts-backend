const { asyncHandler } = require('../../middleware/asyncHandler');
const importService = require('./import.service');

const excel = asyncHandler(async (req, res) => {
  const data = await importService.previewImport(req.file, req.user);
  res.json({ success: true, ...data });
});

const csv = asyncHandler(async (req, res) => {
  const data = await importService.previewImport(req.file, req.user);
  res.json({ success: true, ...data });
});

const confirm = asyncHandler(async (req, res) => {
  const data = await importService.confirmImport(req.params.id, req.body.rows, req.user);
  res.json({ success: true, ...data });
});

const history = asyncHandler(async (req, res) => {
  const data = await importService.importHistory(req.query);
  res.json({ success: true, ...data });
});

module.exports = { excel, csv, confirm, history };
