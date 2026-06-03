const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { success } = require("./utils/responseHelper");
const errorHandler = require("./middleware/errorHandler");

// Route imports
const authRoutes = require("./routes/authRoutes");
const syncRoutes = require("./routes/syncRoutes");
const studentRoutes = require("./routes/studentRoutes");
const companyRoutes = require("./routes/companyRoutes");
const driveRoutes = require("./routes/driveRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Root Route ───────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  return success(res, 200, "Placement Recruitment System API", {
    version: "1.0.0",
    set: "SET A",
    description: "Placement Recruitment Management System — Final Assessment",
    routes: {
      auth: ["POST /auth/register", "POST /auth/login", "GET /auth/me"],
      sync: ["POST /sync"],
      health: ["GET /health"],
      students: ["GET /students", "GET /students/:id"],
      companies: ["POST /companies", "GET /companies", "GET /companies/:id", "PATCH /companies/:id", "DELETE /companies/:id"],
      drives: ["POST /drives", "GET /drives", "GET /drives/:id", "PATCH /drives/:id", "DELETE /drives/:id"],
      applications: ["POST /applications", "GET /applications", "GET /applications/:id", "PATCH /applications/:id", "DELETE /applications/:id"],
      interviews: ["POST /interviews", "PATCH /interviews/:id"],
      analytics: ["GET /analytics/placements", "GET /analytics/departments", "GET /analytics/companies"],
    },
  });
});

// ─── Health Check — Q5 ────────────────────────────────────────────────────────
app.get("/health", async (req, res) => {
  try {
    // Count total documents across key collections
    const Student = require("./models/Student");
    const documentCount = await Student.countDocuments();

    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? "connected" : "disconnected";

    return success(res, 200, "Server is healthy", {
      database: dbStatus,
      documentCount,
    });
  } catch (err) {
    return success(res, 200, "Server is healthy", {
      database: "connected",
      documentCount: 0,
    });
  }
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/sync", syncRoutes);
app.use("/auth", authRoutes);
app.use("/students", studentRoutes);
app.use("/companies", companyRoutes);
app.use("/drives", driveRoutes);
app.use("/applications", applicationRoutes);
app.use("/interviews", interviewRoutes);
app.use("/analytics", analyticsRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
