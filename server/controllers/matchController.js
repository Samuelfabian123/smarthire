const axios = require("axios");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const Match = require("../models/Match");

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || "http://localhost:5001";

/**
 * Calls the Flask NLP microservice to score a resume against a job.
 */
async function scoreMatch(resumeText, jobText) {
  const response = await axios.post(`${NLP_SERVICE_URL}/match`, {
    resumeText,
    jobText,
  });
  return response.data; // { tfidfScore, bertScore, finalScore }
}

// POST /api/matches/job/:jobId
// Job seeker requests a match score between their latest resume and a specific job
exports.matchResumeToJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const resume = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (!resume) return res.status(400).json({ error: "Upload a resume first" });

    const scores = await scoreMatch(resume.extractedText, job.description);

    const match = await Match.findOneAndUpdate(
      { job: job._id, resume: resume._id },
      {
        job: job._id,
        resume: resume._id,
        jobSeeker: req.user.id,
        tfidfScore: scores.tfidfScore,
        bertScore: scores.bertScore,
        finalScore: scores.finalScore,
      },
      { upsert: true, new: true }
    );

    res.json({ message: "Match scored", match });
  } catch (err) {
    res.status(500).json({ error: "Matching failed", details: err.message });
  }
};

// GET /api/matches/job/:jobId/candidates
// Employer views ranked list of candidates for a job they posted
exports.getRankedCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.employer) !== req.user.id) {
      return res.status(403).json({ error: "Not your job posting" });
    }

    const matches = await Match.find({ job: jobId })
      .populate("jobSeeker", "name email")
      .populate("resume", "fileName")
      .sort({ finalScore: -1 });

    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch candidates", details: err.message });
  }
};

// GET /api/matches/mine
// Job seeker views their own match scores across all jobs they've matched against
exports.getMyMatches = async (req, res) => {
  try {
    const matches = await Match.find({ jobSeeker: req.user.id })
      .populate("job", "title location")
      .sort({ finalScore: -1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch matches", details: err.message });
  }
};
