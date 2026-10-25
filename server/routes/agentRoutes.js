const express = require("express");
const router = express.Router();

const { protect, requireRole } = require("../middleware/auth");
const { chatWithAgent } = require("../controllers/agentController");

router.post(
  "/chat",
  protect,
  requireRole("jobseeker"),
  chatWithAgent
);

module.exports = router;