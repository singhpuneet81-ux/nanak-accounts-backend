/**
 * Job Application Model (Mongoose)
 *
 * Stores all 5-step application data plus file references.
 * Supports both specific (linked to a job) and general applications.
 */

const mongoose = require("mongoose");

const personalInfoSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    linkedin: { type: String, trim: true, default: "" },
    portfolio: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    currentRole: { type: String, trim: true, default: "" },
    yearsExperience: { type: String, required: true },
    relevantExperience: { type: String, required: true, minlength: 50 },
    qualifications: {
      type: String,
      required: true,
      enum: ["yes", "in_progress", "equivalent"],
    },
    qualificationsDetail: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const motivationSchema = new mongoose.Schema(
  {
    whyJoin: { type: String, required: true, minlength: 100 },
    whyRole: { type: String, required: true, minlength: 100 },
    strengths: { type: String, required: true, minlength: 50 },
    salaryExpectation: { type: String, required: true },
    availability: { type: String, required: true },
    workArrangement: { type: String, default: "" },
  },
  { _id: false }
);

const documentsSchema = new mongoose.Schema(
  {
    resumeUrl: { type: String, required: true },
    resumeFilename: { type: String, required: true },
    coverLetterUrl: { type: String, default: "" },
    coverLetterFilename: { type: String, default: "" },
  },
  { _id: false }
);

const screeningSchema = new mongoose.Schema(
  {
    workRights: {
      type: String,
      required: true,
      enum: ["citizen", "visa", "sponsorship"],
    },
    relocation: {
      type: String,
      required: true,
      enum: ["yes", "already", "no"],
    },
    noticePeriod: { type: String, required: true },
    references: {
      type: String,
      required: true,
      enum: ["yes", "offer_only", "no_current"],
    },
    privacyConsent: { type: Boolean, required: true },
  },
  { _id: false }
);

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobOpening",
      default: null,
    },
    jobTitle: { type: String, required: true, trim: true },
    applicationType: {
      type: String,
      required: true,
      enum: ["specific", "general"],
      default: "specific",
    },
    personalInfo: { type: personalInfoSchema, required: true },
    experience: { type: experienceSchema, required: true },
    motivation: { type: motivationSchema, required: true },
    documents: { type: documentsSchema, required: true },
    screening: { type: screeningSchema, required: true },
    status: {
      type: String,
      enum: [
        "new",
        "reviewing",
        "shortlisted",
        "interview_scheduled",
        "interview_complete",
        "offer_sent",
        "hired",
        "rejected",
        "withdrawn",
      ],
      default: "new",
    },
    reviewNotes: { type: String, default: "" },
    reviewedBy: { type: String, default: "" },
  },
  {
    timestamps: true,
    collection: "job_applications",
  }
);

// Indexes
jobApplicationSchema.index({ status: 1, createdAt: -1 });
jobApplicationSchema.index({ jobId: 1 });
jobApplicationSchema.index({ "personalInfo.email": 1 });
jobApplicationSchema.index({ applicationType: 1 });

module.exports = mongoose.model("JobApplication", jobApplicationSchema);