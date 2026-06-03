const express = require("express");
const router = express.Router();
const {
  createDrive,
  getDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
} = require("../controllers/driveController");
const { protect } = require("../middleware/authMiddleware");

// POST /drives
router.post("/", protect, createDrive);

// GET /drives
router.get("/", protect, getDrives);

// GET /drives/:id
router.get("/:id", protect, getDriveById);

// PATCH /drives/:id
router.patch("/:id", protect, updateDrive);

// DELETE /drives/:id
router.delete("/:id", protect, deleteDrive);

module.exports = router;
