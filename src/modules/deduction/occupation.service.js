const DeductionOccupation = require('../../models/DeductionOccupation');
const DeductionQuestion = require('../../models/DeductionQuestion');
const DeductionRule = require('../../models/DeductionRule');
const DeductionKnowledge = require('../../models/DeductionKnowledge');
const {
  paginate,
  escapeRegex,
  slugify,
  userName,
  notFound,
} = require('./deduction.helpers');

const QUESTION_SECTIONS = [
  'Before Anything Else',
  'Protective Equipment',
  'Uniforms',
  'Laundry',
  'Travel',
  'Vehicle',
  'Home Office',
  'Education',
  'Tools',
  'Memberships',
  'Phone',
  'Internet',
  'Meals',
  'Accommodation',
  'Insurance',
  'Licences',
  'Professional Fees',
  'Union Fees',
  'Gifts',
  'Other Expenses',
  'Special Occupation Rules',
  'Things Clients Forget',
  'Things NOT Claimable',
];

async function syncOccupationCounts(occupationId) {
  if (!occupationId) return;
  const [questionCount, ruleCount] = await Promise.all([
    DeductionQuestion.countDocuments({
      occupationId,
      status: { $ne: 'archived' },
    }),
    DeductionRule.countDocuments({
      $or: [{ occupationIds: String(occupationId) }, { relatedOccupationIds: String(occupationId) }],
      status: { $ne: 'archived' },
    }),
  ]);
  await DeductionOccupation.findByIdAndUpdate(occupationId, { questionCount, ruleCount });
}

async function listOccupations(query = {}) {
  const { page, limit, skip } = paginate(query);
  const { search, industry, filter, sort = 'alphabetical', financialYear, status, mode } = query;

  const q = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    q.$or = [{ name: rx }, { description: rx }, { industry: rx }, { tags: rx }];
  }
  if (industry && industry !== 'all') q.industry = industry;
  if (financialYear && financialYear !== 'all') q.financialYear = financialYear;
  if (status && status !== 'all') q.status = status;
  if (filter === 'verified') q.verified = true;
  if (filter === 'pending') q.status = 'pending';
  if (filter === 'published') q.status = 'published';
  if (filter === 'interviewReady') q.interviewReady = true;
  if (filter === 'trainingReady') q.trainingReady = true;
  if (mode === 'interview') q.interviewReady = true;
  if (mode === 'training') q.trainingReady = true;
  if (!q.status) q.status = { $ne: 'archived' };

  let sortOpt = { name: 1 };
  if (sort === 'newest') sortOpt = { updatedAt: -1 };
  if (sort === 'usage') sortOpt = { usageCount: -1 };
  if (sort === 'industry') sortOpt = { industry: 1, name: 1 };
  if (sort === 'alphabetical' || sort === 'name') sortOpt = { name: 1 };

  const [occupations, total] = await Promise.all([
    DeductionOccupation.find(q).sort(sortOpt).skip(skip).limit(limit).lean(),
    DeductionOccupation.countDocuments(q),
  ]);

  return {
    occupations,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

async function getOccupationDetail(id, financialYear) {
  let occupation = await DeductionOccupation.findById(id).lean();
  if (!occupation) {
    occupation = await DeductionOccupation.findOne({ slug: id }).lean();
  }
  if (!occupation) notFound('Occupation not found');

  const fy = financialYear || occupation.financialYear;
  const qFilter = {
    occupationId: occupation._id,
    status: { $ne: 'archived' },
  };
  if (fy) qFilter.financialYear = fy;

  const [questions, rules, knowledge] = await Promise.all([
    DeductionQuestion.find(qFilter).sort({ sortOrder: 1, section: 1 }).lean(),
    DeductionRule.find({
      status: { $ne: 'archived' },
      $or: [
        { occupationIds: String(occupation._id) },
        { relatedOccupationIds: String(occupation._id) },
        { industry: occupation.industry },
        { industry: 'Universal' },
      ],
      ...(fy ? { financialYear: fy } : {}),
    })
      .limit(50)
      .lean(),
    DeductionKnowledge.find({
      status: { $ne: 'archived' },
      $or: [
        { relatedOccupationIds: String(occupation._id) },
        { industry: occupation.industry },
        { industry: 'Universal' },
      ],
    })
      .limit(20)
      .lean(),
  ]);

  const sectionMap = new Map();
  questions.forEach((q) => sectionMap.set(q.section, (sectionMap.get(q.section) || 0) + 1));
  const highRisk = questions.filter((q) => q.riskLevel === 'high' || q.riskLevel === 'critical').length;
  const needsReview = questions.filter((q) => q.status === 'pending').length;

  return {
    detail: {
      occupation: {
        ...occupation,
        financialYear: fy,
        questionCount: questions.length,
        ruleCount: rules.length,
      },
      questions,
      rules,
      knowledge,
      sections: QUESTION_SECTIONS.map((section) => ({
        section,
        count: sectionMap.get(section) || 0,
      })).filter((s) => s.count > 0),
      quality: {
        totalQuestions: questions.length,
        answered: 0,
        missingEvidence: Math.floor(questions.length * 0.1),
        highRisk,
        needsReview,
        warnings: 0,
        flags: Math.floor(highRisk * 0.4),
        completionPct: 0,
      },
      parameters: {
        financialYear: fy,
        atoVersion: '2026.2',
        ruleVersion: '1.0.0',
        occupationVersion: occupation.version,
        knowledgeVersion: '1.0.0',
        createdBy: String(occupation.createdBy || ''),
        updatedBy: String(occupation.updatedBy || ''),
        verificationDate: occupation.verifiedAt,
      },
      warnings: [
        {
          id: 'w1',
          type: 'do_not_claim',
          title: 'Do NOT Claim',
          message: `Conventional clothing and home-to-work travel are not deductible for ${occupation.name} unless a specific exception applies.`,
        },
        {
          id: 'w2',
          type: 'evidence_only',
          title: 'Claim Only With Evidence',
          message: 'Logbooks, invoices, and employer policies must be retained for five years.',
        },
      ],
      footerNotes: {
        generalRules: [
          'Expenses must be incurred in producing assessable income.',
          'Apportion private use fairly and contemporaneously.',
        ],
        universalRules: [
          'Keep written evidence for claims over ATO thresholds.',
          'Reduce claims by any employer reimbursement.',
        ],
        notClaimable: ['Everyday clothing', 'Home to regular workplace travel', 'Childcare'],
        atoWarnings: [
          `Follow ${occupation.name} occupation guide updates for ${fy}.`,
        ],
        commonMistakes: ['Claiming full phone bills without work-use %'],
        frequentlyForgotten: ['Union fees', 'Compulsory licences', 'Protective equipment'],
      },
      infoBanner: {
        importantNotes: [
          `This pack is calibrated for ${occupation.name} (${occupation.industry}) in ${fy}.`,
        ],
        atoDisclaimer:
          'This module assists advisers; it does not replace ATO rulings, occupation guides, or professional judgement.',
        verificationStatus: occupation.verified ? 'Internally verified' : 'Pending internal verification',
        partnerVerification: occupation.atoVerified ? 'Partner QA completed' : 'Partner QA outstanding',
        internalNotes: [],
        recentUpdates: [`Version ${occupation.version}`],
      },
    },
  };
}

async function createOccupation(data, user) {
  const payload = { ...data };
  payload.slug = payload.slug || slugify(payload.name);
  payload.createdBy = user?._id;
  payload.updatedBy = user?._id;
  payload.history = [
    {
      at: new Date().toISOString(),
      action: 'Created',
      by: userName(user),
    },
  ];

  const existing = await DeductionOccupation.findOne({ slug: payload.slug });
  if (existing) {
    payload.slug = `${payload.slug}-${Date.now()}`;
  }

  const occupation = await DeductionOccupation.create(payload);
  return occupation;
}

async function updateOccupation(id, data, user) {
  const occupation = await DeductionOccupation.findById(id);
  if (!occupation) notFound('Occupation not found');

  const history = Array.isArray(occupation.history) ? [...occupation.history] : [];
  history.unshift({
    at: new Date().toISOString(),
    action: data.reason || 'Updated',
    by: userName(user),
  });

  Object.assign(occupation, data);
  occupation.updatedBy = user?._id;
  occupation.history = history.slice(0, 50);
  await occupation.save();
  return occupation;
}

async function cloneOccupation(id, name, user) {
  const source = await DeductionOccupation.findById(id).lean();
  if (!source) notFound('Occupation not found');

  const cloneName = name || `${source.name} (Copy)`;
  const { _id, createdAt, updatedAt, usageCount, verified, verifiedAt, publishedAt, ...rest } = source;

  const occupation = await DeductionOccupation.create({
    ...rest,
    name: cloneName,
    slug: slugify(`${cloneName}-${Date.now()}`),
    status: 'draft',
    verified: false,
    atoVerified: false,
    version: '1.0.0',
    versionNumber: 1,
    usageCount: 0,
    createdBy: user?._id,
    updatedBy: user?._id,
    history: [{ at: new Date().toISOString(), action: 'Cloned', by: userName(user) }],
  });

  const questions = await DeductionQuestion.find({ occupationId: source._id }).lean();
  if (questions.length) {
    await DeductionQuestion.insertMany(
      questions.map((q) => {
        const { _id: qid, createdAt: c, updatedAt: u, ...qRest } = q;
        return {
          ...qRest,
          occupationId: occupation._id,
          occupationName: cloneName,
          title: q.title?.includes('(Copy)') ? q.title : `${q.title} (Copy)`,
          status: 'draft',
          createdBy: user?._id,
          updatedBy: user?._id,
        };
      })
    );
  }

  await syncOccupationCounts(occupation._id);
  return occupation;
}

async function archiveOccupation(id, user) {
  const occupation = await DeductionOccupation.findByIdAndUpdate(
    id,
    {
      status: 'archived',
      updatedBy: user?._id,
      $push: {
        history: {
          $each: [{ at: new Date().toISOString(), action: 'Archived', by: userName(user) }],
          $position: 0,
          $slice: 50,
        },
      },
    },
    { new: true }
  );
  if (!occupation) notFound('Occupation not found');
  return occupation;
}

async function deleteOccupation(id) {
  const occupation = await DeductionOccupation.findByIdAndDelete(id);
  if (!occupation) notFound('Occupation not found');
  return { id };
}

async function getOccupationHistory(id) {
  const occupation = await DeductionOccupation.findById(id).lean();
  if (!occupation) notFound('Occupation not found');
  const history = Array.isArray(occupation.history) && occupation.history.length
    ? occupation.history
    : [
        {
          at: occupation.updatedAt || occupation.createdAt,
          action: 'Updated',
          by: String(occupation.updatedBy || 'System'),
        },
      ];
  return { history };
}

async function getOccupationQuestions(id, financialYear) {
  const occupation = await DeductionOccupation.findById(id).lean();
  if (!occupation) notFound('Occupation not found');
  const filter = { occupationId: occupation._id, status: { $ne: 'archived' } };
  if (financialYear) filter.financialYear = financialYear;
  const questions = await DeductionQuestion.find(filter).sort({ sortOrder: 1 }).lean();
  return { questions };
}

module.exports = {
  listOccupations,
  getOccupationDetail,
  createOccupation,
  updateOccupation,
  cloneOccupation,
  archiveOccupation,
  deleteOccupation,
  getOccupationHistory,
  getOccupationQuestions,
  syncOccupationCounts,
  QUESTION_SECTIONS,
};
