const { asyncHandler } = require('../../middleware/asyncHandler');
const reportService = require('./report.service');

const list = asyncHandler(async (req, res) => {
  const data = await reportService.listReports(req.query);
  res.json({ success: true, ...data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await reportService.getReport(req.params.id);
  res.json({ success: true, ...data });
});

const create = asyncHandler(async (req, res) => {
  const data = await reportService.createReportFromCalculation({
    industryId: req.body.industryId,
    financialYear: req.body.financialYear,
    clientInformation: req.body.clientInformation || req.body.client,
    financialInputs: req.body.financialInputs || req.body.inputs,
    notes: req.body.notes,
    user: req.user,
    save: true,
  });
  res.status(201).json({ success: true, ...data });
});

const update = asyncHandler(async (req, res) => {
  const report = await reportService.updateReport(req.params.id, req.body, req.user);
  res.json({ success: true, report });
});

const remove = asyncHandler(async (req, res) => {
  await reportService.deleteReport(req.params.id, req.user);
  res.json({ success: true, message: 'Report deleted' });
});

const duplicate = asyncHandler(async (req, res) => {
  const report = await reportService.duplicateReport(req.params.id, req.user);
  res.status(201).json({ success: true, report });
});

const approve = asyncHandler(async (req, res) => {
  const report = await reportService.approveReport(req.params.id, req.user);
  res.json({ success: true, report });
});

module.exports = { list, getOne, create, update, remove, duplicate, approve };
