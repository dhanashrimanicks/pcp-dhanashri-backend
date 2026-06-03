const express = require("express");
const router = express.Router();
const { getInterviews, scheduleInterview, updateInterview } = require("../controllers/interviewController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// GET /interviews — Added for UI
router.get("/", protect, getInterviews);

// POST /interviews — Q10: Schedule Interview
// Only admin / placement_officer allowed
router.post(
  "/",
  protect,
  authorizeRoles("admin", "placement_officer"),
  scheduleInterview
);

// PATCH /interviews/:id — Q11: Update Interview Result
router.patch("/:id", protect, updateInterview);

module.exports = router;
