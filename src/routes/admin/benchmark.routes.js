const router = require('express').Router();
const multer = require('multer');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roles');
const c = require('../../controllers/admin/benchmark.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(protect);

// Dashboard & analytics — all authenticated staff
router.get('/dashboard', c.getDashboard);
router.get('/analytics', c.getAnalytics);

// Categories
router.get('/categories', c.listCategories);
router.post('/categories', requireRole('admin', 'manager'), c.createCategory);
router.patch('/categories/:id', requireRole('admin', 'manager'), c.updateCategory);
router.delete('/categories/:id', requireRole('admin'), c.deleteCategory);

// Industries
router.get('/industries', c.listIndustries);
router.get('/industries/:id', c.getIndustry);
router.get('/industries/:id/versions', c.listVersions);
router.post('/industries', requireRole('admin', 'manager'), c.createIndustry);
router.patch('/industries/:id', requireRole('admin', 'manager'), c.updateIndustry);
router.delete('/industries/:id', requireRole('admin'), c.deleteIndustry);
router.post('/industries/:id/clone', requireRole('admin', 'manager'), c.cloneIndustry);
router.post('/industries/:id/publish', requireRole('admin'), c.publishIndustry);
router.post('/industries/:id/verify', requireRole('admin', 'manager'), c.verifyIndustry);
router.get('/export/industries', requireRole('admin', 'manager', 'staff'), c.exportIndustries);

// Calculator
router.post('/calculate', c.calculateBenchmark);
router.post('/calculate/preview', c.previewCalculate);

// Reports
router.get('/reports', c.listReports);
router.get('/reports/:id', c.getReport);
router.delete('/reports/:id', requireRole('admin', 'manager'), c.deleteReport);
router.post('/reports/:id/duplicate', c.duplicateReport);

// Import
router.post('/import/preview', requireRole('admin', 'manager'), upload.single('file'), c.previewImport);
router.post('/import/:id/confirm', requireRole('admin', 'manager'), c.confirmImport);

// Settings & logs
router.get('/settings', requireRole('admin', 'manager'), c.getSettings);
router.patch('/settings', requireRole('admin'), c.updateSettings);
router.get('/logs', requireRole('admin', 'manager'), c.listLogs);

module.exports = router;
