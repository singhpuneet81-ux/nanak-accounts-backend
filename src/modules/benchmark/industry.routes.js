const router = require('express').Router();
const { requireBenchmarkPermission } = require('./benchmark.permissions');
const { validate } = require('../../middleware/validate');
const { industryCreateValidators, industryUpdateValidators } = require('./benchmark.validation');
const c = require('./industry.controller');

// static paths before :id
router.get('/search', c.search);
router.get('/verified', c.verified);
router.get('/category/:category', c.byCategory);
router.get('/:id/versions', (req, res, next) => {
  req.query.industryId = req.params.id;
  return require('./benchmark.controller').versionHistory(req, res, next);
});
router.get('/', c.list);
router.get('/:id', c.getOne);
router.post('/', requireBenchmarkPermission('create'), industryCreateValidators, validate, c.create);
router.put('/:id', requireBenchmarkPermission('update'), industryUpdateValidators, validate, c.update);
router.patch('/:id', requireBenchmarkPermission('update'), c.update);
router.delete('/:id', requireBenchmarkPermission('delete'), c.remove);
router.post('/:id/clone', requireBenchmarkPermission('create'), c.clone);
router.post('/:id/publish', requireBenchmarkPermission('publish'), c.publish);
router.post('/:id/verify', requireBenchmarkPermission('approve'), c.verify);

module.exports = router;
