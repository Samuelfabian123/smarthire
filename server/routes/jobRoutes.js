const express = require("express");

const router = express.Router();

const { protect, requireRole } = require("../middleware/auth");

const {
  createJob,
  getAllJobs,
  getMyJobs,
  updateJob,
} = require("../controllers/jobController");

router.post("/", protect, requireRole("employer"), createJob);

router.get("/", protect, getAllJobs);

router.get("/mine", protect, requireRole("employer"), getMyJobs);

// Edit an existing job
router.put("/:jobId", protect, requireRole("employer"), updateJob);

module.exports = router;