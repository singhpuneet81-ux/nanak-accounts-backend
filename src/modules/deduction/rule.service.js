const DeductionRule = require('../../models/DeductionRule');
const {
  paginate,
  escapeRegex,
  userName,
  notFound,
  importPreviewEmpty,
} = require('./deduction.helpers');

async function listRules(query = {}) {
  const { page, limit, skip } = paginate(query);
  const { search, category, financialYear, status, risk } = query;

  const q = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    q.$or = [
      { title: rx },
      { code: rx },
      { atoReference: rx },
      { description: rx },
      { summary: rx },
    ];
  }
  if (category && category !== 'all') q.category = category;
  if (financialYear && financialYear !== 'all') q.financialYear = financialYear;
  if (status && status !== 'all') q.status = status;
  else q.status = { $ne: 'archived' };
  if (risk && risk !== 'all') q.riskLevel = risk;

  const [rules, total] = await Promise.all([
    DeductionRule.find(q).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    DeductionRule.countDocuments(q),
  ]);

  return {
    rules,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

async function getRule(id) {
  const rule = await DeductionRule.findById(id).lean();
  if (!rule) notFound('Rule not found');
  return { rule };
}

async function createRule(data, user) {
  const payload = { ...data };
  payload.createdBy = user?._id;
  payload.updatedBy = user?._id;
  payload.history = [
    {
      version: payload.version || '1.0.0',
      createdBy: userName(user),
      updatedBy: userName(user),
      reason: 'Created',
      date: new Date().toISOString(),
      changeLog: ['Created'],
    },
  ];
  return DeductionRule.create(payload);
}

async function updateRule(id, data, user) {
  const rule = await DeductionRule.findById(id);
  if (!rule) notFound('Rule not found');

  const history = Array.isArray(rule.history) ? [...rule.history] : [];
  history.unshift({
    version: data.version || rule.version,
    createdBy: userName(user),
    updatedBy: userName(user),
    reason: data.reason || 'Updated',
    date: new Date().toISOString(),
    changeLog: [data.reason || 'Updated via admin'],
  });

  Object.assign(rule, data);
  rule.updatedBy = user?._id;
  rule.history = history.slice(0, 50);
  await rule.save();
  return rule;
}

async function deleteRule(id) {
  const rule = await DeductionRule.findByIdAndDelete(id);
  if (!rule) notFound('Rule not found');
  return { id };
}

function previewImport(format) {
  return { preview: importPreviewEmpty(format || 'json', 'rules') };
}

module.exports = {
  listRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  previewImport,
};
