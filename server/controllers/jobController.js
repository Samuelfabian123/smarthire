const Job = require("../models/Job");

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

// GET /api/jobs  (all jobs, for job seekers to browse)
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate("employer", "name companyName").sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch jobs", details: err.message });
  }
};

// GET /api/jobs/mine  (jobs posted by the logged-in employer)
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch jobs", details: err.message });
  }
};
