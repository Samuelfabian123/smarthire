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
      return res.status(404).json({
        error: "Job not found",
      });
    }

    const resume = await Resume.findOne({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    if (!resume) {
      return res.status(400).json({
        error: "Upload a resume first",
      });
    }

    if (!resume.extractedText || !resume.extractedText.trim()) {
      return res.status(400).json({
        error: "The uploaded resume has no readable text. Please upload a text-based PDF or DOCX.",
      });
    }

    // Combine the employer's job description
    // with the specific skills required for the job.
    const requiredSkills = Array.isArray(job.skillsRequired)
      ? job.skillsRequired.join(", ")
      : "";

    const jobText = `
Job Title: ${job.title || ""}

Job Description:
${job.description || ""}

Required Skills:
${requiredSkills}
`.trim();

    const scores = await scoreMatch(
      resume.extractedText,
      jobText
    );

    const match = await Match.findOneAndUpdate(
      {
        job: job._id,
        resume: resume._id,
      },
      {
        job: job._id,
        resume: resume._id,
        jobSeeker: req.user.id,
        tfidfScore: scores.tfidfScore,
        bertScore: scores.bertScore,
        finalScore: scores.finalScore,
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.json({
      message: "Match scored",
      match,
    });
  } catch (err) {
    console.error("Matching error:", err);

    const unavailable = ["ECONNREFUSED", "ENOTFOUND", "ECONNABORTED"].includes(err.code);
    res.status(unavailable ? 503 : 500).json({
      error: unavailable
        ? "AI matching service is unavailable"
        : "Matching failed",
      details: err.response?.data?.details || err.response?.data?.error || err.message,
    });
  }
};

exports.getRankedCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        error: "Job not found",
      });
    }

    if (String(job.employer) !== req.user.id) {
      return res.status(403).json({
        error: "Not your job posting",
      });
    }

    const matches = await Match.find({
      job: jobId,
    })
      .populate("jobSeeker", "name email phone")
      .populate("resume", "fileName")
      .sort({ finalScore: -1 });

    res.json(matches);
  } catch (err) {
    res.status(500).json({
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

    res.json(matches);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch matches",
      details: err.message,
    });
  }
};