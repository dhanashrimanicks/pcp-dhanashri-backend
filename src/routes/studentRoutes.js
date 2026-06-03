const express = require("express");
const router = express.Router();
const { getStudents, getStudentById } = require("../controllers/studentController");
const { protect } = require("../middleware/authMiddleware");

// GET /students
router.get("/", protect, getStudents);

// GET /students/:id
router.get("/:id", protect, getStudentById);

module.exports = router;
