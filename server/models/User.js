
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Keep name for compatibility with existing SmartHire features.
    name: {
      type: String,
      required: true,
      trim: true,
    },

    firstName: {
      type: String,
      trim: true,
      default: "",
    },

    surname: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["jobseeker", "employer"],
      required: true,
    },

    companyName: {
      type: String,
      trim: true,
      default: "",
    },

    companyAddress: {
      type: String,
      trim: true,
      default: "",
    },

    // Email verification.
    // Existing accounts remain usable; new registration will set
    // this to false explicitly in the registration controller.
    isEmailVerified: {
      type: Boolean,
      default: true,
    },

    emailVerificationCodeHash: {
      type: String,
      default: null,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    emailVerificationLastSentAt: {
      type: Date,
      default: null,
    },

    // Password reset fields — keep these for the existing flow.
    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
