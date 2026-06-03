const Company = require("../models/Company");
const { success, error } = require("../utils/responseHelper");

// POST /companies — Q7
const createCompany = async (req, res, next) => {
  try {
    const { name, package: pkg, eligibleDepartments, minimumCgpa, driveDate, status } = req.body;

    if (!name) {
      return error(res, 400, "Company name is required");
    }

    const company = await Company.create({
      name: name.trim(),
      package: pkg || null,
      eligibleDepartments: eligibleDepartments || [],
      minimumCgpa: minimumCgpa || 0,
      driveDate: driveDate || null,
      status: status || "active",
    });

    return success(res, 201, "Company created successfully", company);
  } catch (err) {
    next(err);
  }
};

// GET /companies — Q7
const getCompanies = async (req, res, next) => {
  try {
    const { search, status, department } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (status) {
      filter.status = status;
    }
    if (department) {
      filter.eligibleDepartments = { $in: [department.toUpperCase()] };
    }

    const companies = await Company.find(filter).sort({ name: 1 });
    return success(res, 200, "Companies fetched successfully", companies);
  } catch (err) {
    next(err);
  }
};

// GET /companies/:id — Q7
const getCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return error(res, 404, "Company not found");
    }
    return success(res, 200, "Company fetched successfully", company);
  } catch (err) {
    next(err);
  }
};

// PATCH /companies/:id — Q7
const updateCompany = async (req, res, next) => {
  try {
    const { name, package: pkg, eligibleDepartments, minimumCgpa, driveDate, status } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (pkg !== undefined) updates.package = pkg;
    if (eligibleDepartments !== undefined) updates.eligibleDepartments = eligibleDepartments;
    if (minimumCgpa !== undefined) updates.minimumCgpa = minimumCgpa;
    if (driveDate !== undefined) updates.driveDate = driveDate;
    if (status !== undefined) updates.status = status;

    const company = await Company.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      return error(res, 404, "Company not found");
    }

    return success(res, 200, "Company updated successfully", company);
  } catch (err) {
    next(err);
  }
};

// DELETE /companies/:id — Q7
const deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return error(res, 404, "Company not found");
    }
    return success(res, 200, "Company deleted successfully", null);
  } catch (err) {
    next(err);
  }
};

module.exports = { createCompany, getCompanies, getCompanyById, updateCompany, deleteCompany };
