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
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Simple in-memory TTL cache for hot analytics/dashboard reads */
const cacheStore = new Map();

function cacheGet(key) {
  const hit = cacheStore.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    cacheStore.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value, ttlSeconds = 120) {
  cacheStore.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}

function cacheClear(prefix = '') {
  if (!prefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) cacheStore.delete(key);
  }
}

async function writeBenchmarkLog({ action, entityType, entityId, entityName, details, user }) {
  try {
    const BenchmarkLog = require('../models/BenchmarkLog');
    await BenchmarkLog.create({
      action,
      entityType,
      entityId,
      entityName,
      details,
      createdBy: user?._id,
      createdByName: user?.name || '',
    });
  } catch (_) {
    /* non-blocking */
  }
}

module.exports = {
  slugify,
  paginate,
  escapeRegex,
  cacheGet,
  cacheSet,
  cacheClear,
  writeBenchmarkLog,
};
