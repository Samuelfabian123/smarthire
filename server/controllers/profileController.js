const JobSeekerProfile = require("../models/JobSeekerProfile");
const EmployerProfile = require("../models/EmployerProfile");
const User = require("../models/User");

const getUserId = (req) => req.user?.id || req.user?._id;

const getUploadedFileUrl = (file) => {
  if (!file || !file.filename) return null;
  return `/uploads/${file.filename}`;
};

// GET /api/profile/jobseeker
const getJobSeekerProfile = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Please sign in again." });
    }

    const [profile, user] = await Promise.all([
      JobSeekerProfile.findOne({ user: userId }),
      User.findById(userId).select("name firstName surname email phone"),
    ]);

    const firstName = profile?.firstName || user?.firstName || "";
    const surname = profile?.surname || user?.surname || "";

    const fullName =
      profile?.fullName ||
      [firstName, surname].filter(Boolean).join(" ") ||
      user?.name ||
      "";

    return res.json({
      ...(profile ? profile.toObject() : {}),
      firstName,
      surname,
      fullName,
      phone: profile?.phone || user?.phone || "",
      email: user?.email || "",
    });
  } catch (error) {
    console.error("Get jobseeker profile error:", error);
    return res.status(500).json({
      error: "Unable to load your profile.",
    });
  }
};

// PUT /api/profile/jobseeker
const updateJobSeekerProfile = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Please sign in again." });
    }

    const firstName = String(req.body.firstName || "").trim();
    const surname = String(req.body.surname || "").trim();

    const fullName =
      [firstName, surname].filter(Boolean).join(" ") ||
      String(req.body.fullName || "").trim();

    const profileFields = {
      firstName,
      surname,
      fullName,
      professionalTitle: req.body.professionalTitle || "",
      phone: req.body.phone || "",
      location: req.body.location || "",
      about: req.body.about || "",
      skills: req.body.skills || "",
      education: req.body.education || "",
      experience: req.body.experience || "",
      portfolio: req.body.portfolio || "",
    };

    const photoUrl = getUploadedFileUrl(req.file);

    if (photoUrl) {
      profileFields.photoUrl = photoUrl;
    }

    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: userId },
      { $set: profileFields, $setOnInsert: { user: userId } },
      { new: true, upsert: true, runValidators: true }
    );

    // Keep the main user record consistent with candidate listings.
    const userUpdate = {
      phone: profileFields.phone,
    };

    if (firstName) userUpdate.firstName = firstName;
    if (surname) userUpdate.surname = surname;
    if (fullName) userUpdate.name = fullName;

    await User.findByIdAndUpdate(userId, {
      $set: userUpdate,
    });

    return res.json({
      message: "Profile saved successfully.",
      ...profile.toObject(),
    });
  } catch (error) {
    console.error("Update jobseeker profile error:", error);
    return res.status(500).json({
      error: "Unable to save your profile.",
    });
  }
};

// GET /api/profile/employer
const getEmployerProfile = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Please sign in again." });
    }

    const profile = await EmployerProfile.findOne({ user: userId });

    return res.json(profile || {});
  } catch (error) {
    console.error("Get employer profile error:", error);
    return res.status(500).json({
      error: "Unable to load your company profile.",
    });
  }
};

// PUT /api/profile/employer
const updateEmployerProfile = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Please sign in again." });
    }

    const fields = [
      "companyName",
      "contactName",
      "email",
      "phone",
      "location",
      "industry",
      "description",
      "website",
    ];

    const profileFields = {};

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        profileFields[field] = req.body[field];
      }
    }

    // Persist the uploaded image itself in MongoDB instead of saving a path
    // on Render's temporary filesystem (which disappears after redeploy/restart).
    if (req.file?.buffer) {
      const mimeType = req.file.mimetype || "image/png";
      profileFields.logoDataUrl = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
      profileFields.logoUrl = "";
    }

    const profile = await EmployerProfile.findOneAndUpdate(
      { user: userId },
      { $set: profileFields, $setOnInsert: { user: userId } },
      { new: true, upsert: true, runValidators: true }
    );

    if (profileFields.companyName) {
      await User.findByIdAndUpdate(userId, {
        $set: { companyName: profileFields.companyName },
      });
    }

    return res.json({
      message: "Company profile saved successfully.",
      ...profile.toObject(),
    });
  } catch (error) {
    console.error("Update employer profile error:", error);
    return res.status(500).json({
      error: "Unable to save your company profile.",
    });
  }
};

module.exports = {
  getJobSeekerProfile,
  updateJobSeekerProfile,
  getEmployerProfile,
  updateEmployerProfile,
};