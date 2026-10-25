require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const jobRoutes = require("./routes/jobRoutes");
const matchRoutes = require("./routes/matchRoutes");
const profileRoutes = require("./routes/profileRoutes");
const agentRoutes = require("./routes/agentRoutes");

const app = express();

connectDB();

const configuredClientOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)
  .map((value) => {
    try {
      return new URL(value).origin;
    } catch {
      return value.replace(/\/$/, "");
    }
  });

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "https://smarthire-ldqt.onrender.com",
  ...configuredClientOrigins,
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/profile", profileRoutes);

// SmartHire AI Career Agent
app.use("/api/agent", agentRoutes);

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    error: "Something went wrong",
    details:
      process.env.NODE_ENV === "production"
        ? "An unexpected server error occurred."
        : err.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SmartHire server running on port ${PORT}`);
});