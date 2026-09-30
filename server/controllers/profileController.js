const JobSeekerProfile = require("../models/JobSeekerProfile");
const EmployerProfile = require("../models/EmployerProfile");

// ==========================================
// JOB SEEKER PROFILE
// ==========================================

exports.getJobSeekerProfile = async (req, res) => {
  try {
    const profile = await JobSeekerProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.json(null);
    }

    res.json(profile);
  } catch (error) {
    console.error("Get job seeker profile error:", error);

    res.status(500).json({
      error: "Unable to load profile",
    });
  }
};

exports.updateJobSeekerProfile = async (req, res) => {
  try {
    const {
      fullName,
      professionalTitle,
      phone,
      location,
      about,
      skills,
      education,
      experience,
      portfolio,
    } = req.body;

    let photoUrl;

    if (req.file) {
      photoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const updateData = {
      user: req.user.id,
      fullName,
      professionalTitle,
      phone,
      location,
      about,
      skills,
      education,
      experience,
      portfolio,
    };

    if (photoUrl) {
      updateData.photoUrl = photoUrl;
    }

    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user.id },
      updateData,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json(profile);
  } catch (error) {
    console.error("Update job seeker profile error:", error);

    res.status(500).json({
      error: "Unable to save profile",
      details: error.message,
    });
  }
};

// ==========================================
// EMPLOYER / COMPANY PROFILE
// ==========================================

exports.getEmployerProfile = async (req, res) => {
  try {
    const profile = await EmployerProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.json(null);
    }

    res.json(profile);
  } catch (error) {
    console.error("Get employer profile error:", error);

    res.status(500).json({
      error: "Unable to load company profile",
    });
  }
};

exports.updateEmployerProfile = async (req, res) => {
  try {
    const {
      companyName,
      contactName,
      email,
      phone,
      location,
      industry,
      description,
      website,
    } = req.body;

    let logoUrl;

    if (req.file) {
      logoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const updateData = {
      user: req.user.id,
      companyName,
      contactName,
      email,
      phone,
      location,
      industry,
      description,
      website,
    };

    if (logoUrl) {
      updateData.logoUrl = logoUrl;
    }

    const profile = await EmployerProfile.findOneAndUpdate(
      { user: req.user.id },
      updateData,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json(profile);
  } catch (error) {
    console.error("Update employer profile error:", error);

    res.status(500).json({
      error: "Unable to save company profile",
      details: error.message,
    });
  }
};