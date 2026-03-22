/**
 * Webinar Controller — Public Endpoints
 *
 * Public:
 *   getAll      → Published webinars for /webinars page
 *   getById     → Single webinar detail
 *   register    → Register for a webinar
 */

const Webinar = require("../models/webinar.model");
const WebinarRegistration = require("../models/webinar-registration.model");

// ── Public: Get all published webinars ──

exports.getAll = async (req, res) => {
  try {
    const { category, upcoming, page = 1, limit = 10 } = req.query;
    const filter = { status: "published" };

    if (category) {
      filter.category = category;
    }

    if (upcoming === "true") {
      filter.date = { $gte: new Date() };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Webinar.countDocuments(filter);

    const webinars = await Webinar.find(filter)
      .populate("registered")
      .sort({ featured: -1, date: 1 })
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

// ── Public: Get single webinar ──

exports.getById = async (req, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id).populate("registered");
    if (!webinar) {
      return res.status(404).json({ success: false, error: "Webinar not found" });
    }
    res.json({ success: true, data: webinar });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Public: Register for a webinar ──

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, company } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        error: "firstName, lastName, and email are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Check webinar exists and is published
    const webinar = await Webinar.findById(req.params.id).populate("registered");
    if (!webinar || webinar.status !== "published") {
      return res.status(404).json({
        success: false,
        error: "Webinar not found or not available for registration",
      });
    }

    // Check if max seats reached
    if (webinar.maxSeats && webinar.registered >= webinar.maxSeats) {
      return res.status(400).json({
        success: false,
        error: "This webinar is fully booked",
      });
    }

    // Check duplicate registration
    const existing = await WebinarRegistration.findOne({
      webinarId: req.params.id,
      email: email.toLowerCase(),
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "You are already registered for this webinar",
      });
    }

    // Create registration
    const registration = await WebinarRegistration.create({
      webinarId: req.params.id,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone: phone || "",
      company: company || "",
      status: "registered",
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: registration,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "You are already registered for this webinar",
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};