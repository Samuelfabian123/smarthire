
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Resume = require("../models/Resume");
const Match = require("../models/Match");
const Job = require("../models/Job");
const JobSeekerProfile = require("../models/JobSeekerProfile");

const KNOWN_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#",
  "PHP", "React", "React.js", "Node.js", "Express", "Express.js",
  "MongoDB", "MySQL", "PostgreSQL", "SQL", "Flask", "Django",
  "FastAPI", "HTML", "CSS", "Tailwind CSS", "Bootstrap",
  "Git", "GitHub", "REST API", "REST APIs", "Next.js",
  "Vue.js", "Angular", "Firebase", "Supabase", "Docker",
  "AWS", "Machine Learning", "Natural Language Processing",
  "NLP", "Data Analysis", "TensorFlow", "PyTorch",
  "Figma", "UI/UX Design", "Microsoft Excel", "Power BI",
  "Communication", "Project Management", "Problem Solving",
];

const SECTION_NAMES = [
  "professional summary",
  "summary",
  "profile",
  "career objective",
  "objective",
  "about me",
  "technical skills",
  "key skills",
  "core skills",
  "skills",
  "education",
  "academic background",
  "work experience",
  "professional experience",
  "employment history",
  "experience",
  "projects",
  "certifications",
  "certificates",
  "interests",
  "references",
];

/**
 * Extract readable text from a PDF or DOCX.
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
    const result = await mammoth.extractRawText({
      buffer: fileBuffer,
    });

    return result.value;
  }

  throw new Error(
    "Unsupported file type. Upload a PDF or DOCX file."
  );
}

function cleanText(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function headingName(line) {
  const normalized = cleanText(line)
    .replace(/[:\-–—]+$/, "")
    .replace(/^\d+[.)]?\s*/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

  return SECTION_NAMES.includes(normalized)
    ? normalized
    : null;
}

/**
 * Read text underneath a recognizable CV heading until the next heading.
 */
function extractSection(text, headingNames) {
  const lines = text
    .split("\n")
    .map((line) => line.trim());

  for (let i = 0; i < lines.length; i += 1) {
    const currentHeading = headingName(lines[i]);

    if (!currentHeading || !headingNames.includes(currentHeading)) {
      continue;
    }

    const content = [];

    // Also support headings such as "Skills: JavaScript, React".
    const inlineMatch = lines[i].match(
      /^(?:technical skills|key skills|core skills|skills|education|academic background|work experience|professional experience|employment history|experience|professional summary|summary|profile|career objective|objective|about me)\s*[:\-]\s*(.+)$/i
    );

    if (inlineMatch?.[1]) {
      content.push(inlineMatch[1].trim());
    }

    for (let j = i + 1; j < lines.length; j += 1) {
      if (headingName(lines[j])) break;
      if (lines[j]) content.push(lines[j]);
    }

    const result = cleanText(content.join("\n"));

    if (result) return result;
  }

  return "";
}

/**
 * Prefer explicitly labelled contact details.
 * Do not guess a location from the candidate's university or employer.
 */
function extractLabeledValue(text, labels) {
  const labelPattern = labels.join("|");

  const regex = new RegExp(
    `(?:^|\\n)\\s*(?:${labelPattern})\\s*[:\\-]\\s*([^\\n]+)`,
    "i"
  );

  const match = text.match(regex);
  return match ? cleanText(match[1]) : "";
}

function extractPhone(text) {
  const labeled = extractLabeledValue(text, [
    "phone",
    "phone number",
    "mobile",
    "telephone",
    "contact number",
  ]);

  if (labeled) return labeled;

  const match = text.match(
    /(?:\+?234|0)[\s().-]*[789][\d\s().-]{8,14}\d/
  );

  return match ? cleanText(match[0]) : "";
}

function extractPortfolio(text) {
  const urls =
    text.match(/(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi) || [];

  const portfolioUrl = urls
    .map((url) => url.replace(/[.,;]+$/, ""))
    .find((url) =>
      /linkedin\.com|github\.com|gitlab\.com|bitbucket\.org|portfolio|behance\.net|dribbble\.com/i.test(
        url
      )
    );

  if (portfolioUrl) return portfolioUrl;

  return extractLabeledValue(text, [
    "portfolio",
    "linkedin",
    "github",
    "personal website",
    "website",
  ]);
}

function extractLocation(text) {
  return extractLabeledValue(text, [
    "location",
    "current location",
    "address",
    "residential address",
    "city",
    "based in",
  ]);
}

function extractSkills(text) {
  const section = extractSection(text, [
    "technical skills",
    "key skills",
    "core skills",
    "skills",
  ]);

  if (section) return section;

  // Fallback: only record recognized skills actually present in the CV.
  const found = KNOWN_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  });

  return [...new Set(found)].join(", ");
}

function extractProfileFields(text) {
  const summary = extractSection(text, [
    "professional summary",
    "summary",
    "profile",
    "career objective",
    "objective",
    "about me",
  ]);

  const education = extractSection(text, [
    "education",
    "academic background",
  ]);

  const experience = extractSection(text, [
    "work experience",
    "professional experience",
    "employment history",
    "experience",
  ]);

  return {
    phone: extractPhone(text),
    location: extractLocation(text),
    portfolio: extractPortfolio(text),
    about: summary,
    skills: extractSkills(text),
    education,
    experience,
  };
}

// POST /api/resumes/upload
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    const text = await extractText(
      req.file.buffer,
      req.file.mimetype
    );

    if (!text || !text.trim()) {
      return res.status(400).json({
        error:
          "Could not extract text from file. Please upload a text-based PDF or DOCX.",
      });
    }

    const resume = await Resume.create({
      user: req.user.id,
      fileName: req.file.originalname,
      fileData: req.file.buffer,
      mimeType: req.file.mimetype,
      extractedText: text,
    });

    let profileUpdated = false;
    let extractedFields = [];

    try {
      const existingProfile = await JobSeekerProfile.findOne({
        user: req.user.id,
      });

      const extracted = extractProfileFields(text);
      const updates = {};

      // Fill only blank fields. Never overwrite candidate-entered details.
      for (const field of [
        "phone",
        "location",
        "portfolio",
        "about",
        "skills",
        "education",
        "experience",
      ]) {
        const newValue = cleanText(extracted[field]);
        const oldValue = cleanText(existingProfile?.[field]);

        if (newValue && !oldValue) {
          updates[field] = newValue;
        }
      }

      if (Object.keys(updates).length > 0) {
        await JobSeekerProfile.findOneAndUpdate(
          { user: req.user.id },
          {
            $set: updates,
            $setOnInsert: { user: req.user.id },
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          }
        );

        profileUpdated = true;
        extractedFields = Object.keys(updates);
      }
    } catch (profileError) {
      // A profile-extraction problem should not discard a valid CV upload.
      console.error(
        "CV PROFILE EXTRACTION ERROR:",
        profileError.message
      );
    }

    return res.status(201).json({
      message: profileUpdated
        ? "Resume uploaded. Available profile details were extracted."
        : "Resume uploaded successfully.",
      resume: {
        _id: resume._id,
        fileName: resume.fileName,
        mimeType: resume.mimeType,
        createdAt: resume.createdAt,
      },
      profileUpdated,
      extractedFields,
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
    const resumes = await Resume.find({
      user: req.user.id,
    })
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
// Employers can download CVs only for jobs they own that have a match.
exports.downloadResume = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const resume = await Resume.findById(resumeId).select(
      "+fileData"
    );

    if (!resume) {
      return res.status(404).json({
        error: "Resume not found",
      });
    }

    const employerJobs = await Job.find({
      employer: req.user.id,
    })
      .select("_id")
      .lean();

    const ownedJobIds = employerJobs.map((job) => job._id);

    const match = await Match.findOne({
      resume: resumeId,
      job: { $in: ownedJobIds },
    }).select("_id");

    if (!match) {
      return res.status(403).json({
        error:
          "You can download this CV only for a job you own that the candidate has matched with.",
      });
    }

    if (resume.fileData && resume.fileData.length > 0) {
      res.type(resume.mimeType || "application/octet-stream");
      res.attachment(resume.fileName || "Applicant-CV");
      return res.send(resume.fileData);
    }

    // Support older CVs stored on disk.
    if (resume.filePath && fs.existsSync(resume.filePath)) {
      return res.download(
        path.resolve(resume.filePath),
        resume.fileName
      );
    }

    return res.status(410).json({
      error:
        "This older CV file is no longer stored on the server. Ask the candidate to upload it again.",
    });
  } catch (err) {
    console.error("DOWNLOAD RESUME ERROR:", err);

    return res.status(500).json({
      error: "Failed to download resume",
      details: err.message,
    });
  }
};
