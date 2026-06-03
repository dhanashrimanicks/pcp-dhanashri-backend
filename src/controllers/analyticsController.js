const Student = require("../models/Student");
const Application = require("../models/Application");
const Company = require("../models/Company");
const Drive = require("../models/Drive");
const Interview = require("../models/Interview");
const { success, error } = require("../utils/responseHelper");

// GET /analytics/placements — Q15
const getPlacementAnalytics = async (req, res, next) => {
  try {
    const totalApplications = await Application.countDocuments();
    const shortlistedCount = await Application.countDocuments({ status: "shortlisted" });
    const selectedCount = await Application.countDocuments({ status: "selected" });
    const rejectedCount = await Application.countDocuments({ status: "rejected" });

    return success(res, 200, "Placement analytics fetched successfully", {
      totalApplications,
      shortlistedCount,
      selectedCount,
      rejectedCount,
    });
  } catch (err) {
    next(err);
  }
};

// GET /analytics/departments — Q16
const getDepartmentAnalytics = async (req, res, next) => {
  try {
    // Department-wise placement count and percentage
    const departments = await Student.aggregate([
      {
        $group: {
          _id: "$department",
          totalStudents: { $sum: 1 },
          placedStudents: {
            $sum: { $cond: [{ $eq: ["$status", "placed"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          department: "$_id",
          totalStudents: 1,
          placedStudents: 1,
          placementPercentage: {
            $cond: [
              { $eq: ["$totalStudents", 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$placedStudents", "$totalStudents"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
            ],
          },
        },
      },
      { $sort: { placedStudents: -1 } },
    ]);

    return success(res, 200, "Department analytics fetched successfully", departments);
  } catch (err) {
    next(err);
  }
};

// GET /analytics/companies — Q17
const getCompanyAnalytics = async (req, res, next) => {
  try {
    // Company-wise selected students, highest package, drive participation count
    const analytics = await Application.aggregate([
      {
        $lookup: {
          from: "drives",
          localField: "drive",
          foreignField: "_id",
          as: "driveInfo",
        },
      },
      { $unwind: "$driveInfo" },
      {
        $lookup: {
          from: "companies",
          localField: "driveInfo.company",
          foreignField: "_id",
          as: "companyInfo",
        },
      },
      { $unwind: "$companyInfo" },
      {
        $group: {
          _id: "$companyInfo._id",
          company: { $first: "$companyInfo.name" },
          highestPackage: { $max: "$companyInfo.package" },
          selectedStudents: {
            $sum: { $cond: [{ $eq: ["$status", "selected"] }, 1, 0] },
          },
          driveIds: { $addToSet: "$driveInfo._id" },
        },
      },
      {
        $project: {
          _id: 0,
          company: 1,
          selectedStudents: 1,
          highestPackage: 1,
          driveParticipationCount: { $size: "$driveIds" },
        },
      },
      { $sort: { selectedStudents: -1 } },
    ]);

    return success(res, 200, "Company analytics fetched successfully", analytics);
  } catch (err) {
    next(err);
  }
};

module.exports = { getPlacementAnalytics, getDepartmentAnalytics, getCompanyAnalytics };
