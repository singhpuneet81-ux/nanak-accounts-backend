/**
 * Job Opening Model (Mongoose)
 *
 * Manages job listings displayed on the careers page.
 * Supports featured listings, active/inactive toggling,
 * and structured requirements/responsibilities.
 */

const mongoose = require("mongoose");

const jobOpeningSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["Full-Time", "Part-Time", "Contract", "Casual"],
      default: "Full-Time",
    },
    salary: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    responsibilities: [{ type: String }],
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "job_openings",
  }
);

// Index for public queries (active listings sorted by featured first)
jobOpeningSchema.index({ active: 1, featured: -1, createdAt: -1 });

module.exports = mongoose.model("JobOpening", jobOpeningSchema);