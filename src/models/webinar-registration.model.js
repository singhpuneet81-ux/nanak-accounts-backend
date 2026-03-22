/**
 * Webinar Registration Model (Mongoose)
 *
 * Stores registrations for webinars.
 * Unique index on webinarId + email prevents duplicate registrations.
 */

const mongoose = require("mongoose");

const webinarRegistrationSchema = new mongoose.Schema(
  {
    webinarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Webinar",
      required: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: "" },
    company: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["registered", "attended", "no_show"],
      default: "registered",
    },
    attendedAt: { type: Date, default: null },
    notes: { type: String, trim: true, default: "" },
  },
  {
    timestamps: true,
    collection: "webinar_registrations",
  }
);

// Prevent duplicate registrations (same email + same webinar)
webinarRegistrationSchema.index({ webinarId: 1, email: 1 }, { unique: true });

// Indexes for querying
webinarRegistrationSchema.index({ status: 1 });
webinarRegistrationSchema.index({ webinarId: 1, createdAt: -1 });

module.exports = mongoose.model("WebinarRegistration", webinarRegistrationSchema);