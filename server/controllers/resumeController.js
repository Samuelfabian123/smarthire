const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Resume = require("../models/Resume");
const Match = require("../models/Match");
const Job = require("../models/Job");

/**
 * Extract text from an uploaded PDF or DOCX held in memory by Multer.
 */
async function extractText(fileBuffer, mimeType) {
  if (mimeType === "application/pdf") {
    const data = await pdfParse(fileBuffer);
    return data.text;
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
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

    const text = await extractText(req.file.buffer, req.file.mimetype);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error: "Could not extract text from file. Please upload a text-based PDF or DOCX.",
      });
    }

    const resume = await Resume.create({
      user: req.user.id,
      fileName: req.file.originalname,
      fileData: req.file.buffer,
      mimeType: req.file.mimetype,
      extractedText: text,
    });

    // Never send binary CV contents or extracted personal information in this response.
    return res.status(201).json({
      message: "Resume uploaded",
      resume: {
        _id: resume._id,
        fileName: resume.fileName,
        mimeType: resume.mimeType,
        createdAt: resume.createdAt,
      },
    });
  } catch (err) {
    console.error("RESUME UPLOAD ERROR:", err);
    return res.status(500).json({
      error: "Resume upload failed",
      details: err.message,
    });
  }
};

// GET /api/resumes/mine
exports.getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id })
      .select("-extractedText")
      .sort({ createdAt: -1 });

    return res.json(resumes);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch resumes",
      details: err.message,
    });
  }
};

// GET /api/resumes/:resumeId/download
// An employer can download a CV only if that resume has a match for a job they own.
exports.downloadResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const resume = await Resume.findById(resumeId).select("+fileData");

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const employerJobs = await Job.find({ employer: req.user.id })
      .select("_id")
      .lean();
    const ownedJobIds = employerJobs.map((job) => job._id);

    const match = await Match.findOne({
      resume: resumeId,
      job: { $in: ownedJobIds },
    }).select("_id");

    if (!match) {
      return res.status(403).json({
        error: "You can download this CV only for a job you own that the candidate has matched with.",
      });
    }

    if (resume.fileData && resume.fileData.length > 0) {
      res.type(resume.mimeType || "application/octet-stream");
      res.attachment(resume.fileName || "Applicant-CV");
      return res.send(resume.fileData);
    }

    // Compatibility for pre-existing records that still have a local path.
    if (resume.filePath && fs.existsSync(resume.filePath)) {
      return res.download(path.resolve(resume.filePath), resume.fileName);
    }

    return res.status(410).json({
      error: "This older CV file is no longer stored on the server. Ask the candidate to upload it again; new uploads will be retained.",
    });
  } catch (err) {
    console.error("DOWNLOAD RESUME ERROR:", err);
    return res.status(500).json({
      error: "Failed to download resume",
      details: err.message,
    });
  }
};
