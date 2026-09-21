const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // hashed, never stored plain
    role: { type: String, enum: ["jobseeker", "employer"], required: true },
    companyName: { type: String, trim: true }, // only relevant for employers
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
