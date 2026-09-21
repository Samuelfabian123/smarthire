const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/auth");
const { createJob, getAllJobs, getMyJobs } = require("../controllers/jobController");

router.post("/", protect, requireRole("employer"), createJob);
router.get("/", protect, getAllJobs);
router.get("/mine", protect, requireRole("employer"), getMyJobs);

module.exports = router;
