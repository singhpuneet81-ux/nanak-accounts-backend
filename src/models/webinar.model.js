/**
 * Webinar Model (Mongoose)
 *
 * Manages webinar listings displayed on the /webinars page.
 * Supports featured listings, status management,
 * speaker info, video links, and thumbnail images.
 */

const mongoose = require("mongoose");

const webinarSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    longDescription: { type: String, trim: true, default: "" },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    speaker: { type: String, required: true, trim: true },
    speakerTitle: { type: String, trim: true, default: "" },
    speakerBio: { type: String, trim: true, default: "" },
    speakerImage: { type: String, default: "" },
    videoLink: { type: String, trim: true, default: "" },
    thumbnailImage: { type: String, default: "" },
    learnings: [{ type: String }],
    tags: [{ type: String }],
    maxSeats: { type: Number, default: null },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "draft",
    },
    featured: { type: Boolean, default: false },
    recordingUrl: { type: String, trim: true, default: "" },
    resourceLinks: [
      {
        label: { type: String, trim: true },
        url: { type: String, trim: true },
      },
    ],
  },
  {
    timestamps: true,
    collection: "webinars",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: registered count
webinarSchema.virtual("registered", {
  ref: "WebinarRegistration",
  localField: "_id",
  foreignField: "webinarId",
  count: true,
});

// Indexes
webinarSchema.index({ status: 1, date: -1 });
webinarSchema.index({ featured: -1, date: -1 });
webinarSchema.index({ category: 1 });

module.exports = mongoose.model("Webinar", webinarSchema);