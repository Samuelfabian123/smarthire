const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Resume = require("../models/Resume");

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

// POST /api/resumes/upload  (multipart/form-data, field name: "resume")
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const text = await extractText(req.file.path, req.file.mimetype);

    if (!text || text.trim().length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Could not extract text from file" });
    }

    const resume = await Resume.create({
      user: req.user.id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      extractedText: text,
    });

    res.status(201).json({ message: "Resume uploaded", resume });
  } catch (err) {
    res.status(500).json({ error: "Resume upload failed", details: err.message });
  }
};

// GET /api/resumes/mine
exports.getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch resumes", details: err.message });
  }
};
