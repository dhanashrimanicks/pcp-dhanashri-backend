const Application = require("../models/Application");
const Student = require("../models/Student");
const Drive = require("../models/Drive");
const Company = require("../models/Company");
const { success, error } = require("../utils/responseHelper");

// POST /applications — Q9
// Workflow Rules from QP:
//  1. Student CGPA must satisfy company minimumCgpa
//  2. Student department must be in company eligibleDepartments
//  3. Duplicate applications not allowed (409)
//  4. Closed drives cannot accept applications
const createApplication = async (req, res, next) => {
  try {
    const { student: studentId, drive: driveId } = req.body;

    if (!studentId || !driveId) {
      return error(res, 400, "Student ID and Drive ID are required");
    }

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return error(res, 404, "Student not found");
    }

    // Validate drive exists and populate company
    const drive = await Drive.findById(driveId).populate("company");
    if (!drive) {
      return error(res, 404, "Drive not found");
    }

    // Rule: Closed drives cannot accept applications
    if (drive.status === "closed" || drive.status === "completed") {
      return error(res, 400, "This drive is closed and not accepting applications");
    }

    // Get company for eligibility checks
    const company = drive.company;

    // Rule: Student CGPA must satisfy company minimumCgpa
    if (company && company.minimumCgpa && student.cgpa < company.minimumCgpa) {
      return error(
        res,
        400,
        `Student CGPA (${student.cgpa}) does not meet minimum requirement (${company.minimumCgpa})`
      );
    }

    // Rule: Student department must be in company eligibleDepartments
    if (
      company &&
      company.eligibleDepartments &&
      company.eligibleDepartments.length > 0 &&
      !company.eligibleDepartments.includes(student.department)
    ) {
      return error(
        res,
        400,
        `Student department (${student.department}) is not eligible for this drive`
      );
    }

    // Rule: Duplicate application check (409)
    const existing = await Application.findOne({ student: studentId, drive: driveId });
    if (existing) {
      return error(res, 409, "Student has already applied for this drive");
    }

    const application = await Application.create({
      student: studentId,
      drive: driveId,
      currentRound: 1,
      status: "applied",
      appliedAt: new Date(),
    });

    const populated = await Application.findById(application._id)
      .populate("student", "name email department cgpa studentId")
      .populate({
        path: "drive",
        select: "title status mode location rounds company",
        populate: { path: "company", select: "name package minimumCgpa" },
      });

    return success(res, 201, "Application submitted successfully", populated);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, 409, "Student has already applied for this drive");
    }
    next(err);
  }
};

// GET /applications — Q9 + Q14
// Filters: ?status=shortlisted  ?search=TechNova
// Pagination: ?page=1&limit=10
const getApplications = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    // Search by company name or student name
    if (search) {
      const companies = await Company.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");

      const drives = await Drive.find({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { company: { $in: companies.map((c) => c._id) } },
        ],
      }).select("_id");

      const students = await Student.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");

      filter.$or = [
        { drive: { $in: drives.map((d) => d._id) } },
        { student: { $in: students.map((s) => s._id) } },
      ];
    }

    const total = await Application.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    const applications = await Application.find(filter)
      .populate("student", "name email department cgpa studentId")
      .populate({
        path: "drive",
        select: "title status mode location rounds company",
        populate: { path: "company", select: "name package" },
      })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return success(res, 200, "Applications fetched successfully", {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      applications,
    });
  } catch (err) {
    next(err);
  }
};

// GET /applications/:id
const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("student", "name email department cgpa phone skills studentId")
      .populate({
        path: "drive",
        populate: { path: "company", select: "name package eligibleDepartments minimumCgpa" },
      });

    if (!application) {
      return error(res, 404, "Application not found");
    }

    return success(res, 200, "Application fetched successfully", application);
  } catch (err) {
    next(err);
  }
};

// PATCH /applications/:id
const updateApplication = async (req, res, next) => {
  try {
    const { status, currentRound } = req.body;

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(currentRound && { currentRound }) },
      { new: true, runValidators: true }
    )
      .populate("student", "name email department cgpa")
      .populate({
        path: "drive",
        select: "title status company",
        populate: { path: "company", select: "name" },
      });

    if (!application) {
      return error(res, 404, "Application not found");
    }

    // Mark student as placed when selected
    if (status === "selected") {
      await Student.findByIdAndUpdate(application.student._id, { status: "placed" });
    }

    return success(res, 200, "Application updated successfully", application);
  } catch (err) {
    next(err);
  }
};

// DELETE /applications/:id
const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) {
      return error(res, 404, "Application not found");
    }
    return success(res, 200, "Application deleted successfully", null);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
};
