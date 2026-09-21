const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    extractedText: { type: String, required: true }, // parsed plain text, used for matching
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);
