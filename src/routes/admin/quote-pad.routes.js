const router = require('express').Router();
const multer = require('multer');
const { protect } = require('../../middleware/auth');
const { requireModule } = require('../../middleware/roles');
const { effectiveModules } = require('../../config/modules');
const { validate } = require('../../middleware/validate');
const c = require('../../controllers/quote-pad.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(protect);

function requireAnyQuotePadModule(req, res, next) {
  const mods = effectiveModules(req.user);
  if (mods.includes('quote-pad') || mods.includes('quote-pad-pricing')) return next();
  return res.status(403).json({ success: false, message: 'You do not have access to this module' });
}

// Anyone with the Quote Pad (or its pricing) module can read the pricing config.
router.get('/config', requireAnyQuotePadModule, c.getConfig);

// Editing pricing requires the dedicated pricing permission (admins by default).
router.put('/config', requireModule('quote-pad-pricing'), c.updateConfigValidators, validate, c.updateConfig);
router.post('/config/reset', requireModule('quote-pad-pricing'), c.resetConfig);

// Excel price book (business rates / setups / addons — same schema as v3 CSV)
router.get('/config/price-book/export', requireModule('quote-pad-pricing'), c.exportPriceBook);
router.get('/config/price-book/demo', requireModule('quote-pad-pricing'), c.downloadPriceBookDemo);
router.post(
  '/config/price-book/import',
  requireModule('quote-pad-pricing'),
  upload.single('file'),
  c.importPriceBook
);

router.get('/quotes', requireModule('quote-pad'), c.listQuotes);
router.post('/quotes', requireModule('quote-pad'), c.quoteValidators, validate, c.createQuote);
router.get('/quotes/:id', requireModule('quote-pad'), c.getQuote);
router.put('/quotes/:id', requireModule('quote-pad'), c.updateQuoteValidators, validate, c.updateQuote);
router.delete('/quotes/:id', requireModule('quote-pad'), c.deleteQuote);

module.exports = router;
