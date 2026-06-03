const Drive = require("../models/Drive");
const Company = require("../models/Company");
const { success, error } = require("../utils/responseHelper");

// POST /drives — Q8
const createDrive = async (req, res, next) => {
  try {
    const { company: companyId, title, mode, location, registrationDeadline, rounds, status } =
      req.body;

    if (!companyId || !title) {
      return error(res, 400, "Company ID and title are required");
    }

    const companyDoc = await Company.findById(companyId);
    if (!companyDoc) {
      return error(res, 404, "Company not found");
    }

    const drive = await Drive.create({
      company: companyId,
      title: title.trim(),
      mode: mode || "offline",
      location: location || "",
      registrationDeadline: registrationDeadline || null,
      rounds: rounds || 1,
      status: status || "open",
    });

    const populated = await Drive.findById(drive._id).populate(
      "company",
      "name package minimumCgpa eligibleDepartments"
    );

    return success(res, 201, "Drive created successfully", populated);
  } catch (err) {
    next(err);
  }
};

// GET /drives — Q8 + Q13
// Filters: ?status=open  ?company=TechNova
const getDrives = async (req, res, next) => {
  try {
    const { status, company: companyName, search } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    // Filter by company name — Q13: GET /drives?company=TechNova
    if (companyName) {
      const found = await Company.find({
        name: { $regex: companyName, $options: "i" },
      }).select("_id");

      if (found.length === 0) {
        return success(res, 200, "Drives fetched successfully", []);
      }
      filter.company = { $in: found.map((c) => c._id) };
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const drives = await Drive.find(filter)
      .populate("company", "name package minimumCgpa eligibleDepartments status")
      .sort({ createdAt: -1 });

    return success(res, 200, "Drives fetched successfully", drives);
  } catch (err) {
    next(err);
  }
};

// GET /drives/:id — Q8
const getDriveById = async (req, res, next) => {
  try {
    const drive = await Drive.findById(req.params.id).populate(
      "company",
      "name package minimumCgpa eligibleDepartments status driveDate"
    );

    if (!drive) {
      return error(res, 404, "Drive not found");
    }

    return success(res, 200, "Drive fetched successfully", drive);
  } catch (err) {
    next(err);
  }
};

// PATCH /drives/:id — Q8
const updateDrive = async (req, res, next) => {
  try {
    const { title, mode, location, registrationDeadline, rounds, status } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (mode !== undefined) updates.mode = mode;
    if (location !== undefined) updates.location = location;
    if (registrationDeadline !== undefined) updates.registrationDeadline = registrationDeadline;
    if (rounds !== undefined) updates.rounds = rounds;
    if (status !== undefined) updates.status = status;

    const drive = await Drive.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("company", "name package minimumCgpa eligibleDepartments");

    if (!drive) {
      return error(res, 404, "Drive not found");
    }

    return success(res, 200, "Drive updated successfully", drive);
  } catch (err) {
    next(err);
  }
};

// DELETE /drives/:id — Q8
const deleteDrive = async (req, res, next) => {
  try {
    const drive = await Drive.findByIdAndDelete(req.params.id);
    if (!drive) {
      return error(res, 404, "Drive not found");
    }
    return success(res, 200, "Drive deleted successfully", null);
  } catch (err) {
    next(err);
  }
};

module.exports = { createDrive, getDrives, getDriveById, updateDrive, deleteDrive };
