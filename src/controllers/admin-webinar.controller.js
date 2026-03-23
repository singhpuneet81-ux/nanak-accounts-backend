/**
 * Admin Webinar Controller — Webinar CRUD
 *
 * Admin:
 *   getAll          → All webinars (all statuses) with registration counts
 *   getById         → Single webinar detail
 *   create          → Create new webinar (multipart/form-data for images)
 *   update          → Update existing webinar (multipart/form-data for images)
 *   delete          → Delete webinar and its registrations
 *   toggleStatus    → Change webinar status
 */

const fs = require("fs");
const uploadDir = "uploads/webinars";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const Webinar = require("../models/webinar.model");
const WebinarRegistration = require("../models/webinar-registration.model");

// ── Admin: Get all webinars ──

exports.getAll = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Webinar.countDocuments(filter);

    const webinars = await Webinar.find(filter)
      .populate("actualRegistrations")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: webinars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin: Get single webinar ──

exports.getById = async (req, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id).populate(
      "actualRegistrations",
    );
    if (!webinar) {
      return res
        .status(404)
        .json({ success: false, error: "Webinar not found" });
    }
    res.json({ success: true, data: webinar });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin: Create webinar ──

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };

    // Parse JSON string fields
    if (typeof data.learnings === "string") {
      data.learnings = JSON.parse(data.learnings);
    }
    if (typeof data.tags === "string") {
      data.tags = JSON.parse(data.tags);
    }
    if (typeof data.resourceLinks === "string") {
      data.resourceLinks = JSON.parse(data.resourceLinks);
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.speakerImage && req.files.speakerImage[0]) {
        data.speakerImage = `/uploads/webinars/${req.files.speakerImage[0].filename}`;
      }
      if (req.files.thumbnailImage && req.files.thumbnailImage[0]) {
        data.thumbnailImage = `/uploads/webinars/${req.files.thumbnailImage[0].filename}`;
      }
    }

    const webinar = await Webinar.create(data);
    res.status(201).json({
      success: true,
      message: "Webinar created successfully",
      data: webinar,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ── Admin: Update webinar ──

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };

    // Parse JSON string fields
    if (typeof data.learnings === "string") {
      data.learnings = JSON.parse(data.learnings);
    }
    if (typeof data.tags === "string") {
      data.tags = JSON.parse(data.tags);
    }
    if (typeof data.resourceLinks === "string") {
      data.resourceLinks = JSON.parse(data.resourceLinks);
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.speakerImage && req.files.speakerImage[0]) {
        data.speakerImage = `/uploads/webinars/${req.files.speakerImage[0].filename}`;
      }
      if (req.files.thumbnailImage && req.files.thumbnailImage[0]) {
        data.thumbnailImage = `/uploads/webinars/${req.files.thumbnailImage[0].filename}`;
      }
    }

    const webinar = await Webinar.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!webinar) {
      return res
        .status(404)
        .json({ success: false, error: "Webinar not found" });
    }

    res.json({
      success: true,
      message: "Webinar updated successfully",
      data: webinar,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ── Admin: Delete webinar ──

exports.delete = async (req, res) => {
  try {
    const webinar = await Webinar.findByIdAndDelete(req.params.id);
    if (!webinar) {
      return res
        .status(404)
        .json({ success: false, error: "Webinar not found" });
    }

    // Also delete all registrations for this webinar
    await WebinarRegistration.deleteMany({ webinarId: req.params.id });

    res.json({
      success: true,
      message: "Webinar and its registrations deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin: Toggle webinar status ──

exports.toggleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["draft", "published", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid status. Must be: draft, published, cancelled, or completed",
      });
    }

    const webinar = await Webinar.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!webinar) {
      return res
        .status(404)
        .json({ success: false, error: "Webinar not found" });
    }

    res.json({ success: true, data: webinar });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
