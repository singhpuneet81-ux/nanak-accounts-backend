const Industry = require('../../models/Industry');
const BenchmarkCategory = require('../../models/BenchmarkCategory');
const {
  paginate,
  escapeRegex,
  writeBenchmarkLog,
  cacheClear,
} = require('../../utils/benchmarkHelpers');
const { slugify, createVersionSnapshot } = require('./benchmark.service');

async function listIndustries(query) {
  const { page, limit, skip } = paginate(query);
  const { search, category, categoryId, status, verified, filter, sort = 'alphabetical' } = query;

  const q = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    q.$or = [{ name: rx }, { description: rx }, { category: rx }, { tags: rx }, { primaryBenchmark: rx }];
  }
  if (category && category !== 'all') q.category = category;
  if (categoryId) q.categoryId = categoryId;
  if (status && status !== 'all') q.status = status;
  if (verified === 'true' || filter === 'verified') q.verified = true;
  if (verified === 'false') q.verified = false;
  if (filter === 'pending') q.status = 'pending';
  if (filter === 'recent') {
    q.updatedAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }
  if (!q.status) q.status = { $ne: 'archived' };

  let sortOpt = { name: 1 };
  if (sort === 'newest') sortOpt = { updatedAt: -1 };
  if (sort === 'alphabetical' || sort === 'name') sortOpt = { name: 1 };
  if (sort === 'category') sortOpt = { category: 1, name: 1 };
  if (sort === 'usage') sortOpt = { usageCount: -1 };

  const [industries, total] = await Promise.all([
    Industry.find(q)
      .sort(sortOpt)
      .skip(skip)
      .limit(limit)
      .populate('verifiedBy', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('categoryId', 'name color icon')
      .lean(),
    Industry.countDocuments(q),
  ]);

  return {
    industries: industries.map((i) => ({
      ...i,
      ratioCount: i.ratios?.length || 0,
      verifiedByName: i.verifiedBy?.name || null,
      // legacy aliases for frontend
      ratios: (i.ratios || []).map((r) => ({
        ...r,
        name: r.ratioName,
        key: r.ratioKey,
        min: r.minimum,
        max: r.maximum,
      })),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

async function getIndustryById(id) {
  const industry = await Industry.findById(id)
    .populate('verifiedBy', 'name email')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .populate('categoryId', 'name color icon')
    .lean();
  if (!industry) {
    const err = new Error('Industry not found');
    err.statusCode = 404;
    throw err;
  }

  const BenchmarkVersion = require('../../models/BenchmarkVersion');
  const versions = await BenchmarkVersion.find({ industryId: industry._id })
    .sort({ versionNumber: -1 })
    .limit(20)
    .populate('createdBy', 'name')
    .lean();

  industry.ratios = (industry.ratios || []).map((r) => ({
    ...r,
    name: r.ratioName,
    key: r.ratioKey,
    min: r.minimum,
    max: r.maximum,
  }));
  industry.ratioCount = industry.ratios.length;
  industry.verifiedByName = industry.verifiedBy?.name || null;

  return { industry, versions };
}

function normalizeIncomingRatios(ratios = []) {
  return ratios.map((r) => ({
    ratioName: r.ratioName || r.name,
    ratioKey: r.ratioKey || r.key,
    minimum: r.minimum ?? r.min ?? 0,
    average: r.average ?? 0,
    maximum: r.maximum ?? r.max ?? 0,
    description: r.description || '',
    recommendation: r.recommendation || '',
    severity: r.severity || 'medium',
    unit: r.unit || '%',
    formula: r.formula || '',
    weight: r.weight ?? 1,
    higherIsBetter: r.higherIsBetter ?? true,
  }));
}

async function createIndustry(data, user) {
  const payload = { ...data };
  payload.ratios = normalizeIncomingRatios(payload.ratios || []);
  payload.slug = payload.slug || slugify(payload.name);
  payload.createdBy = user._id;
  payload.updatedBy = user._id;

  if (payload.categoryId && !payload.category) {
    const cat = await BenchmarkCategory.findById(payload.categoryId).lean();
    if (cat) payload.category = cat.name;
  }

  if (payload.ratios?.[0]) {
    const primary =
      payload.ratios.find((r) => r.ratioKey === payload.primaryRatio) || payload.ratios[0];
    payload.averageMargin = primary.average;
    payload.primaryBenchmark = `${primary.ratioName}: ${primary.average}${primary.unit || '%'}`;
  }

  const existing = await Industry.findOne({ slug: payload.slug });
  if (existing) {
    const err = new Error('Industry slug already exists');
    err.statusCode = 409;
    throw err;
  }

  const industry = await Industry.create(payload);
  await createVersionSnapshot(industry, { reason: 'Initial creation', user });
  cacheClear('benchmark:');
  await writeBenchmarkLog({
    action: 'created',
    entityType: 'industry',
    entityId: industry._id,
    entityName: industry.name,
    user,
  });
  return industry;
}

async function updateIndustry(id, data, user) {
  const industry = await Industry.findById(id);
  if (!industry) {
    const err = new Error('Industry not found');
    err.statusCode = 404;
    throw err;
  }

  const previousVersion = industry.version;
  const reason = data.reason || 'Updated via admin';
  const bumpVersion = data.bumpVersion !== false;
  delete data.reason;
  delete data.bumpVersion;

  if (data.ratios) data.ratios = normalizeIncomingRatios(data.ratios);
  Object.assign(industry, data);
  industry.updatedBy = user._id;

  if (bumpVersion) {
    industry.versionNumber += 1;
    const [maj, min, patch] = (previousVersion || '1.0.0').split('.').map(Number);
    industry.version = `${maj || 1}.${min || 0}.${(patch || 0) + 1}`;
  }

  if (industry.ratios?.[0]) {
    const primary =
      industry.ratios.find((r) => r.ratioKey === industry.primaryRatio) || industry.ratios[0];
    industry.averageMargin = primary.average;
    industry.primaryBenchmark = `${primary.ratioName}: ${primary.average}${primary.unit || '%'}`;
  }

  await industry.save();
  await createVersionSnapshot(industry, { reason, user, previousVersion });
  cacheClear('benchmark:');
  await writeBenchmarkLog({
    action: 'updated',
    entityType: 'industry',
    entityId: industry._id,
    entityName: industry.name,
    details: { reason, version: industry.version },
    user,
  });
  return industry;
}

async function deleteIndustry(id, user) {
  const industry = await Industry.findByIdAndUpdate(
    id,
    { status: 'archived', updatedBy: user._id },
    { new: true }
  );
  if (!industry) {
    const err = new Error('Industry not found');
    err.statusCode = 404;
    throw err;
  }
  cacheClear('benchmark:');
  await writeBenchmarkLog({
    action: 'deleted',
    entityType: 'industry',
    entityId: industry._id,
    entityName: industry.name,
    user,
  });
  return industry;
}

async function cloneIndustry(id, name, user) {
  const source = await Industry.findById(id).lean();
  if (!source) {
    const err = new Error('Industry not found');
    err.statusCode = 404;
    throw err;
  }
  const cloneName = name || `${source.name} (Copy)`;
  const {
    _id,
    createdAt,
    updatedAt,
    usageCount,
    verified,
    verifiedBy,
    verificationDate,
    ...rest
  } = source;

  const clone = await Industry.create({
    ...rest,
    name: cloneName,
    slug: slugify(`${cloneName}-${Date.now()}`),
    status: 'draft',
    verified: false,
    version: '1.0.0',
    versionNumber: 1,
    usageCount: 0,
    createdBy: user._id,
    updatedBy: user._id,
  });

  await writeBenchmarkLog({
    action: 'cloned',
    entityType: 'industry',
    entityId: clone._id,
    entityName: clone.name,
    details: { sourceId: source._id },
    user,
  });
  return clone;
}

async function publishIndustry(id, user) {
  const industry = await Industry.findByIdAndUpdate(
    id,
    { status: 'published', publishedAt: new Date(), updatedBy: user._id },
    { new: true }
  );
  if (!industry) {
    const err = new Error('Industry not found');
    err.statusCode = 404;
    throw err;
  }
  cacheClear('benchmark:');
  await writeBenchmarkLog({
    action: 'published',
    entityType: 'industry',
    entityId: industry._id,
    entityName: industry.name,
    user,
  });
  return industry;
}

async function verifyIndustry(id, publish, user) {
  const industry = await Industry.findByIdAndUpdate(
    id,
    {
      verified: true,
      verificationDate: new Date(),
      verifiedBy: user._id,
      status: publish ? 'published' : 'pending',
      publishedAt: publish ? new Date() : undefined,
      updatedBy: user._id,
    },
    { new: true }
  );
  if (!industry) {
    const err = new Error('Industry not found');
    err.statusCode = 404;
    throw err;
  }
  await writeBenchmarkLog({
    action: 'verified',
    entityType: 'industry',
    entityId: industry._id,
    entityName: industry.name,
    user,
  });
  return industry;
}

async function listCategories() {
  return BenchmarkCategory.find({ status: 'active' }).sort({ sortOrder: 1, name: 1 }).lean();
}

async function getCategory(id) {
  const cat = await BenchmarkCategory.findById(id).lean();
  if (!cat) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  return cat;
}

async function createCategory(data, user) {
  const slug = slugify(data.name);
  const existing = await BenchmarkCategory.findOne({ slug });
  if (existing) {
    const err = new Error('Category already exists');
    err.statusCode = 409;
    throw err;
  }
  const cat = await BenchmarkCategory.create({
    ...data,
    slug,
    createdBy: user._id,
  });
  await writeBenchmarkLog({
    action: 'created',
    entityType: 'category',
    entityId: cat._id,
    entityName: cat.name,
    user,
  });
  return cat;
}

async function updateCategory(id, data) {
  const cat = await BenchmarkCategory.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!cat) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  return cat;
}

async function deleteCategory(id, user) {
  const cat = await BenchmarkCategory.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
  if (!cat) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  await writeBenchmarkLog({
    action: 'deleted',
    entityType: 'category',
    entityId: cat._id,
    entityName: cat.name,
    user,
  });
  return cat;
}

module.exports = {
  listIndustries,
  getIndustryById,
  createIndustry,
  updateIndustry,
  deleteIndustry,
  cloneIndustry,
  publishIndustry,
  verifyIndustry,
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
