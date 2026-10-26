
const express = require("express");
const router = express.Router();

const { protect, requireRole } = require("../middleware/auth");

const {
  matchResumeToJob,
  matchExternalJob,
  getRankedCandidates,
  getMyMatches,
  getCandidateDetails,
  updateCandidateDecision,
} = require("../controllers/matchController");

router.post(
  "/job/:jobId",
  protect,
  requireRole("jobseeker"),
  matchResumeToJob
);

router.post("/external", protect, requireRole("jobseeker"), matchExternalJob);

router.get(
  "/job/:jobId/candidates",
  protect,
  requireRole("employer"),
  getRankedCandidates
);

router.patch(
  "/job/:jobId/candidates/:candidateId/decision",
  protect,
  requireRole("employer"),
  updateCandidateDecision
);

router.get(
  "/job/:jobId/candidates/:candidateId",
  protect,
  requireRole("employer"),
  getCandidateDetails
);

router.get(
  "/mine",
  protect,
  requireRole("jobseeker"),
  getMyMatches
);

module.exports = router;
