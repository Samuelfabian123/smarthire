const Job = require("../models/Job");
const { getExternalJobs } = require("../services/externalJobs");

// POST /api/jobs
exports.createJob = async (req, res) => {
  try {
    const { title, description, location, skillsRequired } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }
    const job = await Job.create({
      employer: req.user.id,
      title,
      description,
      location,
      skillsRequired: skillsRequired || [],
    });
    res.status(201).json({ message: "Job posted", job });
  } catch (err) {
    res.status(500).json({ error: "Failed to create job", details: err.message });
  }
};

// GET /api/jobs — combine SmartHire employer listings with permitted external feeds.
exports.getAllJobs = async (req, res) => {
  try {
    const [localJobs, externalJobs] = await Promise.all([
      Job.find().populate("employer", "name companyName").sort({ createdAt: -1 }).lean(),
      getExternalJobs().catch((err) => {
        console.error("External job feed unavailable:", err.message);
        return [];
      }),
    ]);

    const ownJobs = localJobs.map((job) => ({
      ...job,
      external: false,
      source: "SmartHire",
      company: job.employer?.companyName || job.employer?.name || "SmartHire employer",
      applyUrl: "",
      sourceUrl: "",
    }));

    res.set("Cache-Control", "private, max-age=60");
    res.json([...ownJobs, ...externalJobs]);
  } catch (err) {
    console.error("Failed to fetch jobs:", err.message);
    res.status(500).json({ error: "Failed to fetch jobs", details: err.message });
  }
};

// GET /api/jobs/mine
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch jobs", details: err.message });
  }
};

// PUT /api/jobs/:jobId
exports.updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { title, description, location, skillsRequired } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.employer) !== String(req.user.id)) {
      return res.status(403).json({ error: "You are not allowed to edit this job" });
    }
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }
    job.title = title;
    job.description = description;
    job.location = location || "";
    job.skillsRequired = Array.isArray(skillsRequired) ? skillsRequired : [];
    await job.save();
    res.json({ message: "Job updated successfully", job });
  } catch (err) {
    res.status(500).json({ error: "Failed to update job", details: err.message });
  }
};
