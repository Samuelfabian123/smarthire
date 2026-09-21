const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadResume, getMyResumes } = require("../controllers/resumeController");

router.post("/upload", protect, requireRole("jobseeker"), upload.single("resume"), uploadResume);
router.get("/mine", protect, requireRole("jobseeker"), getMyResumes);

module.exports = router;
