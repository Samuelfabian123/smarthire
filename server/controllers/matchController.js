const axios = require("axios");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const Match = require("../models/Match");

const NLP_SERVICE_URL = (
  process.env.NLP_SERVICE_URL || "http://localhost:5001"
).replace(/\/+$/, "");

async function scoreMatch(resumeText, jobText) {
  const response = await axios.post(
    `${NLP_SERVICE_URL}/match`,
    { resumeText, jobText },
    { timeout: 60000 }
  );

  return response.data;
}

exports.matchResumeToJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const resume = await Resume.findOne({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    if (!resume) {
      return res.status(400).json({
        error: "Upload a resume first",
      });
    }

    if (!resume.extractedText?.trim()) {
      return res.status(400).json({
        error:
          "Your CV has no readable text. Please upload a text-based PDF or DOCX.",
      });
    }

    const requiredSkills = Array.isArray(job.skillsRequired)
      ? job.skillsRequired
      : [];

    const jobText = `
Job Title: ${job.title || ""}

Job Description:
${job.description || ""}

Required Skills:
${requiredSkills.join(", ")}
`.trim();

    const scores = await scoreMatch(
      resume.extractedText,
      jobText
    );

    const matchedSkills = Array.isArray(scores.matchedSkills)
      ? scores.matchedSkills
      : [];

    const detectedRequiredSkills = Array.isArray(
      scores.requiredSkills
    )
      ? scores.requiredSkills
      : requiredSkills;

    const missingSkills = Array.isArray(scores.missingSkills)
      ? scores.missingSkills
      : detectedRequiredSkills.filter(
          (skill) =>
            !matchedSkills.some(
              (matched) =>
                matched.toLowerCase() === skill.toLowerCase()
            )
        );

    const match = await Match.findOneAndUpdate(
      {
        job: job._id,
        resume: resume._id,
      },
      {
        $set: {
          job: job._id,
          resume: resume._id,
          jobSeeker: req.user.id,
          tfidfScore: scores.tfidfScore ?? 0,
          bertScore: scores.bertScore ?? 0,
          finalScore: scores.finalScore ?? 0,
          matchedSkills,
          requiredSkills: detectedRequiredSkills,
          missingSkills,
          skillScore: scores.skillScore ?? 0,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return res.json({
      message: "Match scored",
      match,
      matchedSkills,
      requiredSkills: detectedRequiredSkills,
      missingSkills,
      skillScore: scores.skillScore ?? 0,
      finalScore: scores.finalScore ?? 0,
    });
  } catch (err) {
    console.error(
      "Matching error:",
      err.response?.data || err.message
    );

    const status = err.response?.status;
    const unavailable = [
      "ECONNREFUSED",
      "ENOTFOUND",
      "ECONNABORTED",
      "ETIMEDOUT",
    ].includes(err.code);

    if (status === 429) {
      return res.status(429).json({
        error:
          "The AI matching service is temporarily busy. Please try again shortly.",
      });
    }

    return res.status(unavailable ? 503 : 500).json({
      error: unavailable
        ? "AI matching service is unavailable"
        : "Matching failed",
      details:
        err.response?.data?.details ||
        err.response?.data?.error ||
        err.message,
    });
  }
};

exports.getRankedCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (String(job.employer) !== req.user.id) {
      return res.status(403).json({
        error: "Not your job posting",
      });
    }

    const matches = await Match.find({ job: jobId })
      .populate("jobSeeker", "name email phone")
      .populate("resume", "fileName")
      .sort({ finalScore: -1 });

    return res.json(matches);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch candidates",
      details: err.message,
    });
  }
};

exports.getMyMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      jobSeeker: req.user.id,
    })
      .populate("job", "title location")
      .sort({ finalScore: -1 });

    return res.json(matches);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch matches",
      details: err.message,
    });
  }
};