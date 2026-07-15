const { body, param } = require('express-validator');
const QuotePadConfig = require('../models/QuotePadConfig');
const QuotePadQuote = require('../models/QuotePadQuote');
const { asyncHandler } = require('../middleware/asyncHandler');
const { defaultQuotePadConfig } = require('../data/quotePadDefaults');

// Deep-merge saved config over defaults so newly added keys always exist.
function mergeDeep(base, saved) {
  if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
  if (base && typeof base === 'object') {
    const out = { ...base };
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      Object.keys(saved).forEach((k) => {
        out[k] = k in base ? mergeDeep(base[k], saved[k]) : saved[k];
      });
    }
    return out;
  }
  return saved === undefined || saved === null ? base : saved;
}

function mergedConfig(doc) {
  const defaults = defaultQuotePadConfig();
  if (!doc) return defaults;
  return {
    firm: mergeDeep(defaults.firm, doc.firm || {}),
    household: mergeDeep(defaults.household, doc.household || {}),
    business: mergeDeep(defaults.business, doc.business || {}),
  };
}

// ─── Config ───

const getConfig = asyncHandler(async (_req, res) => {
  const doc = await QuotePadConfig.findOne({ key: 'default' }).lean();
  res.json({ success: true, config: mergedConfig(doc) });
});

const updateConfigValidators = [
  body('firm').optional().isObject(),
  body('household').optional().isObject(),
  body('business').optional().isObject(),
];

const updateConfig = asyncHandler(async (req, res) => {
  const updates = { updatedBy: req.user._id };
  ['firm', 'household', 'business'].forEach((k) => {
    if (req.body[k] && typeof req.body[k] === 'object') updates[k] = req.body[k];
  });
  const doc = await QuotePadConfig.findOneAndUpdate(
    { key: 'default' },
    { $set: updates },
    { new: true, upsert: true }
  ).lean();
  res.json({ success: true, config: mergedConfig(doc) });
});

const resetConfig = asyncHandler(async (req, res) => {
  await QuotePadConfig.deleteOne({ key: 'default' });
  res.json({ success: true, config: defaultQuotePadConfig() });
});

// ─── Saved quotes ───

const listQuotes = asyncHandler(async (_req, res) => {
  const quotes = await QuotePadQuote.find().sort({ updatedAt: -1 }).limit(500).lean();
  res.json({ success: true, quotes });
});

const getQuote = asyncHandler(async (req, res) => {
  const quote = await QuotePadQuote.findById(req.params.id).lean();
  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
  res.json({ success: true, quote });
});

const quoteValidators = [
  body('kind').isIn(['household', 'entity']),
  body('title').isString().notEmpty(),
  body('data').isObject(),
  body('total').optional().isNumeric(),
  body('label').optional().isString(),
  body('structure').optional().isString(),
];

const createQuote = asyncHandler(async (req, res) => {
  const last = await QuotePadQuote.findOne().sort({ number: -1 }).select('number').lean();
  const number = (last ? last.number : 0) + 1;
  const quote = await QuotePadQuote.create({
    number,
    kind: req.body.kind,
    label: req.body.label || '',
    structure: req.body.structure || (req.body.kind === 'household' ? 'household' : 'entity'),
    title: req.body.title,
    total: Number(req.body.total) || 0,
    data: req.body.data,
    createdBy: req.user._id,
    createdByName: req.user.name,
  });
  res.status(201).json({ success: true, quote });
});

const updateQuoteValidators = [
  param('id').isString().notEmpty(),
  body('title').optional().isString(),
  body('data').optional().isObject(),
  body('total').optional().isNumeric(),
  body('label').optional().isString(),
  body('structure').optional().isString(),
];

const updateQuote = asyncHandler(async (req, res) => {
  const quote = await QuotePadQuote.findById(req.params.id);
  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
  ['title', 'data', 'label', 'structure'].forEach((k) => {
    if (req.body[k] !== undefined) quote[k] = req.body[k];
  });
  if (req.body.total !== undefined) quote.total = Number(req.body.total) || 0;
  await quote.save();
  res.json({ success: true, quote });
});

const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await QuotePadQuote.findById(req.params.id);
  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
  await QuotePadQuote.deleteOne({ _id: quote._id });
  res.json({ success: true, message: 'Quote deleted' });
});

module.exports = {
  getConfig,
  updateConfig,
  updateConfigValidators,
  resetConfig,
  listQuotes,
  getQuote,
  createQuote,
  quoteValidators,
  updateQuote,
  updateQuoteValidators,
  deleteQuote,
};
