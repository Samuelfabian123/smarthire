const multer = require("multer");

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed"), false);
};

// Keep employer logos in memory for this request, then persist the image
// data in MongoDB so it survives Render restarts and redeployments.
module.exports = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
