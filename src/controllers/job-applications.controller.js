/**
 * Job Applications Controller
 *
 * Public:
 *   submit          → Submit a specific job application (multipart/form-data)
 *   submitGeneral   → Submit a general/speculative application (multipart/form-data)
 *
 * Admin:
 *   getAll          → List all applications with filters
 *   getById         → Single application detail
 *   updateStatus    → Update application status
 *   addNote         → Add review notes
 *   delete          → Delete application
 *   getStats        → Dashboard statistics
 */

const fs = require("fs");
const uploadDir = "uploads/applications";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


const multer = require("multer");
const path = require("path");
const JobApplication = require("../models/job-application.model");
const JobOpening = require("../models/job-opening.model");

// ── Multer config for file uploads ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/applications/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, and DOCX files are allowed"), false);
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).fields([
  { name: "resume", maxCount: 1 },
  { name: "coverLetter", maxCount: 1 },
]);

// ── Public: Submit specific application ──
exports.submit = async (req, res) => {
  try {
    const body = JSON.parse(req.body.applicationData);
    const files = req.files || {};

    // Validate resume
    if (!files.resume || files.resume.length === 0) {
      return res.status(400).json({ success: false, error: "Resume is required" });
    }

    // Validate job exists
    if (body.jobId) {
      const job = await JobOpening.findById(body.jobId);
      if (!job) {
        return res.status(404).json({ success: false, error: "Job opening not found" });
      }
    }

    const resumeFile = files.resume[0];
    const coverLetterFile = files.coverLetter ? files.coverLetter[0] : null;

    const application = await JobApplication.create({
      jobId: body.jobId || null,
      jobTitle: body.jobTitle,
      applicationType: "specific",
      personalInfo: body.personalInfo,
      experience: body.experience,
      motivation: body.motivation,
      documents: {
        resumeUrl: `/uploads/applications/${resumeFile.filename}`,
        resumeFilename: resumeFile.originalname,
        coverLetterUrl: coverLetterFile
          ? `/uploads/applications/${coverLetterFile.filename}`
          : "",
        coverLetterFilename: coverLetterFile
          ? coverLetterFile.originalname
          : "",
      },
      screening: body.screening,
      status: "new",
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: { applicationId: application._id },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ── Public: Submit general application ──
exports.submitGeneral = async (req, res) => {
  try {
    const body = JSON.parse(req.body.applicationData);
    const files = req.files || {};

    if (!files.resume || files.resume.length === 0) {
      return res.status(400).json({ success: false, error: "Resume is required" });
    }

    const resumeFile = files.resume[0];
    const coverLetterFile = files.coverLetter ? files.coverLetter[0] : null;

    const application = await JobApplication.create({
      jobId: null,
      jobTitle: body.jobTitle || "General Application",
      applicationType: "general",
      personalInfo: body.personalInfo,
      experience: body.experience,
      motivation: body.motivation,
      documents: {
        resumeUrl: `/uploads/applications/${resumeFile.filename}`,
        resumeFilename: resumeFile.originalname,
        coverLetterUrl: coverLetterFile
          ? `/uploads/applications/${coverLetterFile.filename}`
          : "",
        coverLetterFilename: coverLetterFile
          ? coverLetterFile.originalname
          : "",
      },
      screening: body.screening,
      status: "new",
    });

    res.status(201).json({
      success: true,
      message: "General application submitted successfully",
      data: { applicationId: application._id },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ── Admin: Get all applications ──
exports.getAll = async (req, res) => {
  try {
    const {
      status,
      applicationType,
      jobId,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (applicationType) filter.applicationType = applicationType;
    if (jobId) filter.jobId = jobId;
    if (search) {
      filter.$or = [
        { "personalInfo.firstName": { $regex: search, $options: "i" } },
        { "personalInfo.lastName": { $regex: search, $options: "i" } },
        { "personalInfo.email": { $regex: search, $options: "i" } },
        { jobTitle: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [applications, total] = await Promise.all([
      JobApplication.find(filter)
        .populate("jobId", "title department location")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      JobApplication.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: applications.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: applications,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin: Get single application ──
exports.getById = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id).populate(
      "jobId",
      "title department location type salary"
    );
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }
    res.json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin: Update status ──
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "new", "reviewing", "shortlisted", "interview_scheduled",
      "interview_complete", "offer_sent", "hired", "rejected", "withdrawn",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }
    res.json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin: Add review notes ──
exports.addNote = async (req, res) => {
  try {
    const { notes, reviewedBy } = req.body;
    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { $set: { reviewNotes: notes, reviewedBy } },
      { new: true }
    );
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }
    res.json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin: Delete application ──
exports.delete = async (req, res) => {
  try {
    const application = await JobApplication.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }
    res.json({ success: true, message: "Application deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin: Dashboard stats ──
exports.getStats = async (req, res) => {
  try {
    const [total, byStatus, byType, recent] = await Promise.all([
      JobApplication.countDocuments(),
      JobApplication.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      JobApplication.aggregate([
        { $group: { _id: "$applicationType", count: { $sum: 1 } } },
      ]),
      JobApplication.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("jobTitle personalInfo.firstName personalInfo.lastName status createdAt"),
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
        byType: Object.fromEntries(byType.map((t) => [t._id, t.count])),
        recent,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};