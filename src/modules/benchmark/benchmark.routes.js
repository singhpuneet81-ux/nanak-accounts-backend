const router = require('express').Router();
const multer = require('multer');
const { protect } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { requireBenchmarkPermission } = require('./benchmark.permissions');
const { calculateValidators } = require('./benchmark.validation');

const benchmarkController = require('./benchmark.controller');
const analyticsController = require('./analytics.controller');
const importController = require('./import.controller');

const categoryRoutes = require('./category.routes');
const industryRoutes = require('./industry.routes');
const reportRoutes = require('./report.routes');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.use(protect);

// Categories
router.use('/categories', categoryRoutes);

// Industries
router.use('/industries', industryRoutes);

// Calculator
router.post(
  '/calculate',
  requireBenchmarkPermission('calculate'),
  calculateValidators,
  validate,
  benchmarkController.calculate
);
router.post(
  '/calculate/preview',
  requireBenchmarkPermission('calculate'),
  calculateValidators,
  validate,
  benchmarkController.previewCalculate
);

// Reports
router.use('/reports', reportRoutes);

// Analytics
router.get('/analytics/dashboard', analyticsController.dashboard);
router.get('/analytics/monthly', analyticsController.monthly);
router.get('/analytics/risk', analyticsController.risk);
router.get('/analytics/categories', analyticsController.categories);
router.get('/analytics/industries', analyticsController.industries);
// Alias used by frontend
router.get('/dashboard', analyticsController.dashboard);
router.get('/analytics', analyticsController.industries);

// Import
router.post('/import/excel', requireBenchmarkPermission('import'), upload.single('file'), importController.excel);
router.post('/import/csv', requireBenchmarkPermission('import'), upload.single('file'), importController.csv);
router.post('/import/preview', requireBenchmarkPermission('import'), upload.single('file'), importController.excel);
router.post('/import/:id/confirm', requireBenchmarkPermission('import'), importController.confirm);
router.get('/import/history', requireBenchmarkPermission('import'), importController.history);

// Version control
router.get('/version', benchmarkController.listAllVersions);
router.post('/version', requireBenchmarkPermission('create'), benchmarkController.createVersion);
router.put('/version/:id', requireBenchmarkPermission('update'), benchmarkController.updateVersion);
router.get('/version/history', benchmarkController.versionHistory);

// Settings
router.get('/settings', requireBenchmarkPermission('view'), benchmarkController.getSettings);
router.put('/settings', requireBenchmarkPermission('update'), benchmarkController.updateSettings);
router.patch('/settings', requireBenchmarkPermission('update'), benchmarkController.updateSettings);

// Export / logs
router.get('/export/industries', requireBenchmarkPermission('export'), benchmarkController.exportIndustries);
router.get('/logs', requireBenchmarkPermission('view'), benchmarkController.listLogs);

module.exports = router;
