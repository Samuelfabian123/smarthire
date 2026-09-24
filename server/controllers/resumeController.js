const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Resume = require("../models/Resume");
const Match = require("../models/Match");
const Job = require("../models/Job");

/**
 * Extracts plain text from an uploaded resume file (PDF or DOCX).
 */
async function extractText(filePath, mimeType) {
  if (mimeType === "application/pdf") {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new Error("Unsupported file type. Upload a PDF or DOCX file.");
}

// POST /api/resumes/upload
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const text = await extractText(req.file.path, req.file.mimetype);

    if (!text || text.trim().length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: "Could not extract text from file",
      });
    }

    const resume = await Resume.create({
      user: req.user.id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      extractedText: text,
    });

    res.status(201).json({
      message: "Resume uploaded",
      resume,
    });
  } catch (err) {
    res.status(500).json({
      error: "Resume upload failed",
      details: err.message,
    });
  }
};

// GET /api/resumes/mine
exports.getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(resumes);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch resumes",
      details: err.message,
    });
  }
};

// GET /api/resumes/:resumeId/download
// Employer can download a CV only when the CV belongs to a candidate
// who has a match/application for one of the employer's jobs.
exports.downloadResume = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({
        error: "Resume not found",
      });
    }

    // Find a match connecting this resume to a job
    const match = await Match.findOne({
      resume: resumeId,
    });

    if (!match) {
      return res.status(403).json({
        error: "You are not authorized to access this resume",
      });
    }

    // Check that the job belongs to the logged-in employer
    const job = await Job.findById(match.job);

    if (!job) {
      return res.status(404).json({
        error: "Job not found",
      });
    }

    if (String(job.employer) !== String(req.user.id)) {
      return res.status(403).json({
        error: "You are not authorized to access this resume",
      });
    }

    if (!fs.existsSync(resume.filePath)) {
      return res.status(404).json({
        error: "CV file is no longer available",
      });
    }

    return res.download(
      path.resolve(resume.filePath),
      resume.fileName
    );
  } catch (err) {
    console.error("DOWNLOAD RESUME ERROR:", err);

    return res.status(500).json({
      error: "Failed to download resume",
      details: err.message,
    });
  }
};