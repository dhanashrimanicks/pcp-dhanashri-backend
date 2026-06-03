const Student = require("../models/Student");
const { success, error } = require("../utils/responseHelper");

// GET /students
// Filters: ?department=CSE  ?cgpaMin=8  ?status=active
const getStudents = async (req, res, next) => {
  try {
    const { department, cgpaMin, cgpaMax, status, batch, search } = req.query;

    const filter = {};

    if (department) {
      filter.department = { $regex: department, $options: "i" };
    }

    if (cgpaMin) {
      filter.cgpa = { ...filter.cgpa, $gte: parseFloat(cgpaMin) };
    }

    if (cgpaMax) {
      filter.cgpa = { ...filter.cgpa, $lte: parseFloat(cgpaMax) };
    }

    if (status) {
      filter.status = status;
    }

    if (batch) {
      filter.batch = parseInt(batch);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    const students = await Student.find(filter).sort({ name: 1 });

    return success(res, 200, "Students fetched successfully", students);
  } catch (err) {
    next(err);
  }
};

// GET /students/:id
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try finding by MongoDB _id first, then by studentId
    let student = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(id);
    }

    if (!student) {
      student = await Student.findOne({ studentId: id });
    }

    if (!student) {
      return error(res, 404, "Student not found");
    }

    return success(res, 200, "Student fetched successfully", student);
  } catch (err) {
    next(err);
  }
};

module.exports = { getStudents, getStudentById };
