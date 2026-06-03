const express = require("express");
const router = express.Router();
const {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} = require("../controllers/companyController");
const { protect } = require("../middleware/authMiddleware");

// POST /companies
router.post("/", protect, createCompany);

// GET /companies
router.get("/", protect, getCompanies);

// GET /companies/:id
router.get("/:id", protect, getCompanyById);

// PATCH /companies/:id
router.patch("/:id", protect, updateCompany);

// DELETE /companies/:id
router.delete("/:id", protect, deleteCompany);

module.exports = router;
