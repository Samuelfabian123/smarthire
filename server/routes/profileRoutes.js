const express = require("express");

const {
  getJobSeekerProfile,
  updateJobSeekerProfile,
  getEmployerProfile,
  updateEmployerProfile,
} = require("../controllers/profileController");

const { protect } = require("../middleware/auth");
const profileUpload = require("../middleware/profileUpload");

const router = express.Router();

// ==========================================
// JOB SEEKER PROFILE
// ==========================================

router.get(
  "/jobseeker",
  protect,
  getJobSeekerProfile
);

router.put(
  "/jobseeker",
  protect,
  profileUpload.single("photo"),
  updateJobSeekerProfile
);

// ==========================================
// EMPLOYER / COMPANY PROFILE
// ==========================================

router.get(
  "/employer",
  protect,
  getEmployerProfile
);

router.put(
  "/employer",
  protect,
  profileUpload.single("logo"),
  updateEmployerProfile
);

module.exports = router;