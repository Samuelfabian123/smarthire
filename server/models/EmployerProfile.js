const mongoose = require("mongoose");

const employerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    companyName: {
      type: String,
      default: "",
    },

    contactName: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    industry: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    logoUrl: {
      type: String,
      default: "",
    },

    // Base64 data URL is stored in MongoDB so the logo survives Render deploys.
    logoDataUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "EmployerProfile",
  employerProfileSchema
);