const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    // New uploads are stored in MongoDB so deploys don't orphan the underlying file.
    fileData: { type: Buffer, select: false },
    mimeType: { type: String, default: "application/octet-stream" },
    // Retained for compatibility with older records uploaded to local disk.
    filePath: { type: String },
    extractedText: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);
