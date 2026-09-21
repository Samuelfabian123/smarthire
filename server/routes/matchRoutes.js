const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/auth");
const {
  matchResumeToJob,
  getRankedCandidates,
  getMyMatches,
} = require("../controllers/matchController");

router.post("/job/:jobId", protect, requireRole("jobseeker"), matchResumeToJob);
router.get("/job/:jobId/candidates", protect, requireRole("employer"), getRankedCandidates);
router.get("/mine", protect, requireRole("jobseeker"), getMyMatches);

module.exports = router;
