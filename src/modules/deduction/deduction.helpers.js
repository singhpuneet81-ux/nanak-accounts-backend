function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function paginate(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function escapeRegex(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function userName(user) {
  if (!user) return 'System';
  return user.name || user.email || String(user._id || 'System');
}

function notFound(message) {
  const err = new Error(message || 'Not found');
  err.statusCode = 404;
  throw err;
}

function badRequest(message) {
  const err = new Error(message || 'Bad request');
  err.statusCode = 400;
  throw err;
}

function importPreviewEmpty(format = 'json', kind = 'items') {
  return {
    rows: 0,
    valid: 0,
    invalid: 0,
    duplicates: 0,
    errors: [],
    sample: [{ title: `Sample ${kind}`, format, status: 'valid' }],
  };
}

function stripMeta(doc) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  return rest;
}

module.exports = {
  slugify,
  paginate,
  escapeRegex,
  userName,
  notFound,
  badRequest,
  importPreviewEmpty,
  stripMeta,
};
