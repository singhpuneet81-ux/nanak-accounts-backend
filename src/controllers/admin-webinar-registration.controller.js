/**
 * Admin Webinar Registration Controller
 *
 * Admin:
 *   getAllForWebinar    → All registrations for a specific webinar
 *   getAll             → All registrations across all webinars
 *   updateStatus       → Update registration status (attended/no_show)
 *   delete             → Delete a registration
 *   exportCSV          → Export registrations as CSV
 */

const WebinarRegistration = require("../models/webinar-registration.model");
const Webinar = require("../models/webinar.model");

// ── Admin: Get registrations for a specific webinar ──

exports.getAllForWebinar = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = { webinarId: req.params.id };

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await WebinarRegistration.countDocuments(filter);

    const registrations = await WebinarRegistration.find(filter)
      .populate("webinarId", "title date")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Map to include webinar title
    const data = registrations.map((reg) => ({
      ...reg.toObject(),
      webinarTitle: reg.webinarId?.title || "Unknown",
    }));

    res.json({
      success: true,
      data,
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

// ── Admin: Get all registrations (all webinars) ──

exports.getAll = async (req, res) => {
  try {
    const { webinarId, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (webinarId) {
      filter.webinarId = webinarId;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await WebinarRegistration.countDocuments(filter);

    const registrations = await WebinarRegistration.find(filter)
      .populate("webinarId", "title date")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const data = registrations.map((reg) => ({
      ...reg.toObject(),
      webinarTitle: reg.webinarId?.title || "Unknown",
    }));

    res.json({
      success: true,
      data,
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

// ── Admin: Update registration status ──

exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!["registered", "attended", "no_show"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: registered, attended, or no_show",
      });
    }

    const updateData = { status };
    if (notes !== undefined) updateData.notes = notes;
    if (status === "attended") updateData.attendedAt = new Date();

    const registration = await WebinarRegistration.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ success: false, error: "Registration not found" });
    }

    res.json({ success: true, data: registration });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin: Delete registration ──

exports.delete = async (req, res) => {
  try {
    const registration = await WebinarRegistration.findByIdAndDelete(req.params.id);
    if (!registration) {
      return res.status(404).json({ success: false, error: "Registration not found" });
    }
    res.json({ success: true, message: "Registration deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin: Export registrations as CSV ──

exports.exportCSV = async (req, res) => {
  try {
    const registrations = await WebinarRegistration.find({
      webinarId: req.params.id,
    })
      .populate("webinarId", "title date")
      .sort({ createdAt: -1 });

    const webinar = await Webinar.findById(req.params.id);
    const webinarTitle = webinar ? webinar.title.replace(/[^a-zA-Z0-9]/g, "_") : "webinar";

    // Build CSV
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Company",
      "Status",
      "Registered At",
      "Attended At",
      "Notes",
    ];

    const rows = registrations.map((reg) => [
      reg.firstName,
      reg.lastName,
      reg.email,
      reg.phone || "",
      reg.company || "",
      reg.status,
      reg.createdAt ? reg.createdAt.toISOString() : "",
      reg.attendedAt ? reg.attendedAt.toISOString() : "",
      reg.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${webinarTitle}_registrations.csv"`
    );
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};