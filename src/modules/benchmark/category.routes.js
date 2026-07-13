const router = require('express').Router();
const { requireBenchmarkPermission } = require('./benchmark.permissions');
const { validate } = require('../../middleware/validate');
const { categoryValidators } = require('./benchmark.validation');
const c = require('./benchmark.controller');

router.get('/', c.listCategories);
router.get('/:id', c.getCategory);
router.post('/', requireBenchmarkPermission('create'), categoryValidators, validate, c.createCategory);
router.put('/:id', requireBenchmarkPermission('update'), c.updateCategory);
router.patch('/:id', requireBenchmarkPermission('update'), c.updateCategory);
router.delete('/:id', requireBenchmarkPermission('delete'), c.deleteCategory);

module.exports = router;
