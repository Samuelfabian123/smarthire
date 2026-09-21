const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true }, // used as jobText for matching
    location: { type: String, trim: true },
    skillsRequired: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
