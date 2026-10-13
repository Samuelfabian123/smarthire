const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },

    jobSeeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tfidfScore: {
      type: Number,
      required: true,
      default: 0,
    },

    bertScore: {
      type: Number,
      required: true,
      default: 0,
    },

    finalScore: {
      type: Number,
      required: true,
      default: 0,
    },

    skillScore: {
      type: Number,
      default: 0,
    },

    matchedSkills: {
      type: [String],
      default: [],
    },

    requiredSkills: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Prevent duplicate match records for the same resume/job pair
matchSchema.index({ job: 1, resume: 1 }, { unique: true });

module.exports = mongoose.model("Match", matchSchema);