const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.Mixed },
    answer: { type: mongoose.Schema.Types.Mixed, default: null },
    evidence: [{ type: String }],
    notes: { type: String, default: '' },
    flagged: { type: Boolean, default: false },
    managerComment: { type: String, default: '' },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const deductionInterviewSchema = new mongoose.Schema(
  {
    occupationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeductionOccupation',
      index: true,
    },
    occupationName: { type: String, default: '' },
    clientName: { type: String, default: '', index: true },
    mode: { type: String, enum: ['interview', 'training'], default: 'interview', index: true },
    financialYear: { type: String, default: '2025-26', index: true },
    employmentType: { type: String, default: '' },
    businessType: { type: String, default: '' },
    state: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'completed', 'abandoned', 'review', 'saved'],
      default: 'in_progress',
      index: true,
    },
    progress: { type: Number, default: 0 },
    answeredCount: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    riskScore: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 0 },
    answers: [answerSchema],
    quality: { type: mongoose.Schema.Types.Mixed, default: {} },
    trainingScore: { type: mongoose.Schema.Types.Mixed, default: {} },
    aiInsights: [{ type: mongoose.Schema.Types.Mixed }],
    currentQuestionIndex: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.Mixed },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true, collection: 'deduction_interviews', strict: false }
);

deductionInterviewSchema.index({ mode: 1, status: 1 });
deductionInterviewSchema.index({ occupationId: 1, createdAt: -1 });

module.exports =
  mongoose.models.DeductionInterview ||
  mongoose.model('DeductionInterview', deductionInterviewSchema);
