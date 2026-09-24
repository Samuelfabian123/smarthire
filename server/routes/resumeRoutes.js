const express = require("express");

const router = express.Router();

const { protect, requireRole } = require("../middleware/auth");

const upload = require("../middleware/upload");

const {
  uploadResume,
  getMyResumes,
  downloadResume,
} = require("../controllers/resumeController");

router.post(
  "/upload",
  protect,
  requireRole("jobseeker"),
  upload.single("resume"),
  uploadResume
);

router.get(
  "/mine",
  protect,
  requireRole("jobseeker"),
  getMyResumes
);

router.get(
  "/:resumeId/download",
  protect,
  requireRole("employer"),
  downloadResume
);

module.exports = router;