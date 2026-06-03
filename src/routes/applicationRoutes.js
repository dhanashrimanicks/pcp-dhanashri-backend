const express = require("express");
const router = express.Router();
const {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
} = require("../controllers/applicationController");
const { protect } = require("../middleware/authMiddleware");

// POST /applications
router.post("/", protect, createApplication);

// GET /applications  (supports ?page=1&limit=10  ?status=shortlisted  ?search=TechNova)
router.get("/", protect, getApplications);

// GET /applications/:id
router.get("/:id", protect, getApplicationById);

// PATCH /applications/:id
router.patch("/:id", protect, updateApplication);

// DELETE /applications/:id
router.delete("/:id", protect, deleteApplication);

module.exports = router;
