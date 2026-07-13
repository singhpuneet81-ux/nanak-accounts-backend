const DeductionKnowledge = require('../../models/DeductionKnowledge');
const {
  paginate,
  escapeRegex,
  userName,
  notFound,
  importPreviewEmpty,
} = require('./deduction.helpers');

async function listKnowledge(query = {}) {
  const { page, limit, skip } = paginate({ ...query, limit: query.limit || 12 });
  const { search, type, status } = query;

  const q = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    q.$or = [{ title: rx }, { summary: rx }, { atoReference: rx }, { tags: rx }];
  }
  if (type && type !== 'all') q.type = type;
  if (status && status !== 'all') q.status = status;
  else q.status = { $ne: 'archived' };

  const [articles, total, publicRulings, atoReferences] = await Promise.all([
    DeductionKnowledge.find(q).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    DeductionKnowledge.countDocuments(q),
    DeductionKnowledge.countDocuments({ type: 'public_ruling', status: { $ne: 'archived' } }),
    DeductionKnowledge.countDocuments({
      type: { $in: ['ato_reference', 'ato_publication', 'ato_website'] },
      status: { $ne: 'archived' },
    }),
  ]);

  return {
    articles,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    catalogue: { publicRulings, atoReferences },
  };
}

async function getKnowledge(id) {
  const article = await DeductionKnowledge.findById(id).lean();
  if (!article) notFound('Article not found');
  return { article };
}

async function createKnowledge(data, user) {
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
  return DeductionKnowledge.create(payload);
}

async function updateKnowledge(id, data, user) {
  const article = await DeductionKnowledge.findById(id);
  if (!article) notFound('Article not found');

  const history = Array.isArray(article.history) ? [...article.history] : [];
  history.unshift({
    version: data.version || article.version,
    createdBy: userName(user),
    updatedBy: userName(user),
    reason: data.reason || 'Updated',
    date: new Date().toISOString(),
    changeLog: [data.reason || 'Updated via admin'],
  });

  Object.assign(article, data);
  article.updatedBy = user?._id;
  article.history = history.slice(0, 50);
  await article.save();
  return article;
}

async function deleteKnowledge(id) {
  const article = await DeductionKnowledge.findByIdAndDelete(id);
  if (!article) notFound('Article not found');
  return { id };
}

function previewImport(format) {
  return { preview: importPreviewEmpty(format || 'json', 'knowledge') };
}

module.exports = {
  listKnowledge,
  getKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  previewImport,
};
