const router = require('express').Router();
const { requireBenchmarkPermission } = require('./benchmark.permissions');
const { validate } = require('../../middleware/validate');
const { reportValidators } = require('./benchmark.validation');
const c = require('./report.controller');
const benchmarkController = require('./benchmark.controller');

router.get('/', c.list);
router.get('/:id', c.getOne);
router.get('/:id/pdf', requireBenchmarkPermission('export'), benchmarkController.downloadReportPdf);
router.post('/', requireBenchmarkPermission('create'), reportValidators, validate, c.create);
router.put('/:id', requireBenchmarkPermission('update'), c.update);
router.patch('/:id', requireBenchmarkPermission('update'), c.update);
router.delete('/:id', requireBenchmarkPermission('delete'), c.remove);
router.post('/:id/duplicate', requireBenchmarkPermission('create'), c.duplicate);
router.post('/:id/approve', requireBenchmarkPermission('approve'), c.approve);

module.exports = router;
