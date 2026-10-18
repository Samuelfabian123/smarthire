
const axios = require("axios");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const Match = require("../models/Match");
const JobSeekerProfile = require("../models/JobSeekerProfile");

const NLP_SERVICE_URL = (
  process.env.NLP_SERVICE_URL || "http://127.0.0.1:5001"
).replace(/\/+$/, "");

// ==========================================
// AI SCORING SERVICE
// ==========================================

async function scoreMatch(resumeText, jobText) {
  const response = await axios.post(
    `${NLP_SERVICE_URL}/match`,
    { resumeText, jobText },
    { timeout: 60000 }
  );

  return response.data;
}

// ==========================================
// JOB SEEKER: MATCH RESUME TO A JOB
// ==========================================

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

    const scores = await scoreMatch(resume.extractedText, jobText);

    const matchedSkills = Array.isArray(scores.matchedSkills)
      ? scores.matchedSkills
      : [];

    const detectedRequiredSkills = Array.isArray(scores.requiredSkills)
      ? scores.requiredSkills
      : requiredSkills;

    const missingSkills = Array.isArray(scores.missingSkills)
      ? scores.missingSkills
      : detectedRequiredSkills.filter(
          (skill) =>
            !matchedSkills.some(
              (matched) =>
                String(matched).toLowerCase() ===
                String(skill).toLowerCase()
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

// ==========================================
// EMPLOYER: GET RANKED CANDIDATES
// ==========================================

exports.getRankedCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        error: "Job not found",
      });
    }

    if (String(job.employer) !== String(req.user.id)) {
      return res.status(403).json({
        error: "Not your job posting",
      });
    }

    const matches = await Match.find({ job: jobId })
      .populate("jobSeeker", "name email phone")
      .populate("resume", "fileName")
      .sort({ finalScore: -1 });

    const userIds = matches
      .map((match) => match.jobSeeker?._id)
      .filter(Boolean);

    const profiles = await JobSeekerProfile.find({
      user: { $in: userIds },
    }).select(
      "user photoUrl fullName professionalTitle location phone"
    );

    const profileMap = new Map(
      profiles.map((profile) => [
        String(profile.user),
        profile,
      ])
    );

    const candidates = matches.map((match) => {
      const candidate = match.toObject();
      const userId = candidate.jobSeeker?._id;

      return {
        ...candidate,
        jobSeekerProfile: userId
          ? profileMap.get(String(userId)) || null
          : null,
      };
    });

    return res.json(candidates);
  } catch (err) {
    console.error("Failed to fetch candidates:", err.message);

    return res.status(500).json({
      error: "Failed to fetch candidates",
      details: err.message,
    });
  }
};

// ==========================================
// JOB SEEKER: GET MY MATCHES
// ==========================================

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

// ==========================================
// EMPLOYER: VIEW ONE CANDIDATE'S DETAILS
// ==========================================

exports.getCandidateDetails = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        error: "Job not found",
      });
    }

    // Only the employer who owns the job can view its applicants.
    if (String(job.employer) !== String(req.user.id)) {
      return res.status(403).json({
        error: "Not your job posting",
      });
    }

    // candidateId is the Match document ID.
    const match = await Match.findOne({
      _id: candidateId,
      job: jobId,
    })
      .populate("jobSeeker", "name email phone")
      .populate("resume", "fileName createdAt");

    if (!match || !match.jobSeeker) {
      return res.status(404).json({
        error: "Candidate not found for this job",
      });
    }

    // Retrieve all saved candidate profile fields.
    const profile = await JobSeekerProfile.findOne({
      user: match.jobSeeker._id,
    }).lean();

    return res.json({
      match: match.toObject(),
      jobSeekerProfile: profile || null,
    });
  } catch (err) {
    console.error("Get candidate details error:", err);

    return res.status(500).json({
      error: "Unable to load candidate details",
    });
  }
};
