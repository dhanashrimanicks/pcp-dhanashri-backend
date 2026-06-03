const express = require("express");
const router = express.Router();
const {
  getPlacementAnalytics,
  getDepartmentAnalytics,
  getCompanyAnalytics,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

// GET /analytics/placements  (Q15 — note: "placements" with 's')
router.get("/placements", protect, getPlacementAnalytics);

// GET /analytics/departments  (Q16)
router.get("/departments", protect, getDepartmentAnalytics);

// GET /analytics/companies  (Q17)
router.get("/companies", protect, getCompanyAnalytics);

module.exports = router;
