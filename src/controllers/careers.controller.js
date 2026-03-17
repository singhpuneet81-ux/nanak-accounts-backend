/**
 * Careers Controller — Job Openings CRUD
 *
 * Public:
 *   getAll        → Active listings for careers page
 *   getById       → Single listing detail
 *
 * Admin:
 *   adminGetAll   → All listings (including inactive)
 *   create        → Create new opening
 *   update        → Update existing opening
 *   delete        → Delete opening
 *   toggleActive  → Activate/deactivate listing
 *   seed          → Seed default openings from JSON
 */


const JobOpening = require("../models/job-opening.model");

// ── Public ──

exports.getAll = async (req, res) => {
  try {
    const { department, location, search } = req.query;
    const filter = { active: true };

    if (department && department !== "All Departments") {
      filter.department = department;
    }
    if (location && location !== "All Locations") {
      filter.location = location;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const openings = await JobOpening.find(filter).sort({
      featured: -1,
      createdAt: -1,
    });

    res.json({
      success: true,
      count: openings.length,
      data: openings,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const opening = await JobOpening.findOne({
      _id: req.params.id,
      active: true,
    });
    if (!opening) {
      return res.status(404).json({ success: false, error: "Opening not found" });
    }
    res.json({ success: true, data: opening });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin ──

exports.adminGetAll = async (req, res) => {
  try {
    const { status, department } = req.query;
    const filter = {};
    if (status === "active") filter.active = true;
    if (status === "inactive") filter.active = false;
    if (department) filter.department = department;

    const openings = await JobOpening.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: openings.length, data: openings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const opening = await JobOpening.create(req.body);
    res.status(201).json({ success: true, data: opening });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const opening = await JobOpening.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!opening) {
      return res.status(404).json({ success: false, error: "Opening not found" });
    }
    res.json({ success: true, data: opening });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const opening = await JobOpening.findByIdAndDelete(req.params.id);
    if (!opening) {
      return res.status(404).json({ success: false, error: "Opening not found" });
    }
    res.json({ success: true, message: "Opening deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.toggleActive = async (req, res) => {
  try {
    const opening = await JobOpening.findById(req.params.id);
    if (!opening) {
      return res.status(404).json({ success: false, error: "Opening not found" });
    }
    opening.active = !opening.active;
    await opening.save();
    res.json({ success: true, data: opening });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.seed = async (req, res) => {
  try {
    const seedData = require("../seeders/careers-openings-seeder.json");
    await JobOpening.deleteMany({});
    const created = await JobOpening.insertMany(seedData);
    res.json({
      success: true,
      message: `Seeded ${created.length} job openings`,
      data: created,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};