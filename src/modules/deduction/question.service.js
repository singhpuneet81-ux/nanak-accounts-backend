const DeductionQuestion = require('../../models/DeductionQuestion');
const DeductionKnowledge = require('../../models/DeductionKnowledge');
const DeductionOccupation = require('../../models/DeductionOccupation');
const {
  paginate,
  escapeRegex,
  userName,
  notFound,
  importPreviewEmpty,
} = require('./deduction.helpers');
const { syncOccupationCounts } = require('./occupation.service');

async function listQuestions(query = {}) {
  const { page, limit, skip } = paginate(query);
  const {
    search,
    status,
    risk,
    section,
    occupationId,
    industry,
    financialYear,
    difficulty,
    questionType,
    atoVerified,
    mode,
  } = query;

  const q = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    q.$or = [
      { title: rx },
      { question: rx },
      { atoRule: rx },
      { atoReference: rx },
      { occupationName: rx },
      { tags: rx },
    ];
  }
  if (status && status !== 'all') q.status = status;
  else q.status = { $ne: 'archived' };
  if (risk && risk !== 'all') q.riskLevel = risk;
  if (section && section !== 'all') q.section = section;
  if (occupationId && occupationId !== 'all') q.occupationId = occupationId;
  if (industry && industry !== 'all') q.industry = industry;
  if (financialYear && financialYear !== 'all') q.financialYear = financialYear;
  if (difficulty && difficulty !== 'all') q.difficulty = difficulty;
  if (questionType && questionType !== 'all') q.questionType = questionType;
  if (atoVerified === 'true') q.atoVerified = true;
  if (atoVerified === 'false') q.atoVerified = false;
  if (mode === 'interview') q.interviewMode = true;
  if (mode === 'training') q.trainingMode = true;

  const [
    questions,
    total,
    published,
    draft,
    archived,
    highRisk,
    evidenceRequired,
    atoLinked,
    knowledgeArticles,
  ] = await Promise.all([
    DeductionQuestion.find(q).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    DeductionQuestion.countDocuments(q),
    DeductionQuestion.countDocuments({ ...q, status: 'published' }),
    DeductionQuestion.countDocuments({ ...q, status: 'draft' }),
    DeductionQuestion.countDocuments({ status: 'archived' }),
    DeductionQuestion.countDocuments({
      ...q,
      riskLevel: { $in: ['high', 'critical'] },
    }),
    DeductionQuestion.countDocuments({
      ...q,
      'evidenceItems.requirement': 'required',
    }),
    DeductionQuestion.countDocuments({
      ...q,
      atoReference: { $exists: true, $nin: [null, ''] },
    }),
    DeductionKnowledge.countDocuments({ status: { $ne: 'archived' } }),
  ]);

  return {
    questions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    stats: {
      total,
      published,
      draft,
      archived,
      highRisk,
      evidenceRequired,
      atoLinked,
      knowledgeArticles,
    },
  };
}

async function getQuestion(id) {
  const question = await DeductionQuestion.findById(id).lean();
  if (!question) notFound('Question not found');
  return { question };
}

async function createQuestion(data, user) {
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

  if (payload.occupationId && !payload.occupationName) {
    const occ = await DeductionOccupation.findById(payload.occupationId).lean();
    if (occ) {
      payload.occupationName = occ.name;
      payload.industry = payload.industry || occ.industry;
    }
  }

  const question = await DeductionQuestion.create(payload);
  if (question.occupationId) await syncOccupationCounts(question.occupationId);
  return question;
}

async function updateQuestion(id, data, user) {
  const question = await DeductionQuestion.findById(id);
  if (!question) notFound('Question not found');

  const history = Array.isArray(question.history) ? [...question.history] : [];
  history.unshift({
    version: data.version || question.version,
    createdBy: userName(user),
    updatedBy: userName(user),
    reason: data.reason || 'Updated',
    date: new Date().toISOString(),
    changeLog: [data.reason || 'Updated via admin'],
  });

  Object.assign(question, data);
  question.updatedBy = user?._id;
  question.history = history.slice(0, 50);
  await question.save();
  if (question.occupationId) await syncOccupationCounts(question.occupationId);
  return question;
}

async function duplicateQuestion(id, user) {
  const source = await DeductionQuestion.findById(id).lean();
  if (!source) notFound('Question not found');

  const { _id, createdAt, updatedAt, ...rest } = source;
  const question = await DeductionQuestion.create({
    ...rest,
    title: `${source.title} (Copy)`,
    status: 'draft',
    version: '1.0.0',
    createdBy: user?._id,
    updatedBy: user?._id,
    history: [
      {
        version: '1.0.0',
        createdBy: userName(user),
        updatedBy: userName(user),
        reason: 'Duplicated',
        date: new Date().toISOString(),
        changeLog: [`Duplicated from ${id}`],
      },
    ],
  });
  if (question.occupationId) await syncOccupationCounts(question.occupationId);
  return question;
}

async function deleteQuestion(id) {
  const question = await DeductionQuestion.findByIdAndDelete(id);
  if (!question) notFound('Question not found');
  if (question.occupationId) await syncOccupationCounts(question.occupationId);
  return { id };
}

function previewImport(format) {
  return { preview: importPreviewEmpty(format || 'json', 'questions') };
}

module.exports = {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  duplicateQuestion,
  deleteQuestion,
  previewImport,
};
