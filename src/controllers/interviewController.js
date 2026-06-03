const Interview = require("../models/Interview");
const Application = require("../models/Application");
const { success, error } = require("../utils/responseHelper");

// GET /interviews — Added to support UI rendering
const getInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find()
      .populate({
        path: "application",
        populate: [
          { path: "student", select: "name email department" },
          { path: "drive", select: "title", populate: { path: "company", select: "name" } },
        ],
      })
      .sort({ scheduledAt: 1 });
    return success(res, 200, "Interviews fetched successfully", interviews);
  } catch (err) {
    next(err);
  }
};

// POST /interviews — Q10 (Schedule Interview)
// Only admin / placement_officer allowed (enforced via authorizeRoles middleware)
// Workflow Rules from QP:
//  - Application must exist
//  - Interview date must be valid
//  - Rejected applications cannot receive interviews
const scheduleInterview = async (req, res, next) => {
  try {
    const { application: applicationId, interviewer, round, scheduledAt } = req.body;

    if (!applicationId || !scheduledAt) {
      return error(res, 400, "Application ID and scheduled date are required");
    }

    // Validate application exists
    const application = await Application.findById(applicationId)
      .populate("student", "name")
      .populate({ path: "drive", populate: { path: "company", select: "name" } });

    if (!application) {
      return error(res, 404, "Application not found");
    }

    // Rule: Rejected applications cannot receive interviews
    if (application.status === "rejected") {
      return error(res, 400, "Cannot schedule interview for a rejected application");
    }

    // Rule: Interview date must be valid
    const interviewDate = new Date(scheduledAt);
    if (isNaN(interviewDate.getTime())) {
      return error(res, 400, "Invalid scheduled date");
    }

    const interview = await Interview.create({
      application: applicationId,
      interviewer: interviewer || "",
      round: round || application.currentRound || 1,
      scheduledAt: interviewDate,
      result: "pending",
    });

    const populated = await Interview.findById(interview._id).populate({
      path: "application",
      populate: [
        { path: "student", select: "name email department" },
        { path: "drive", select: "title", populate: { path: "company", select: "name" } },
      ],
    });

    return success(res, 201, "Interview scheduled successfully", populated);
  } catch (err) {
    next(err);
  }
};

// PATCH /interviews/:id — Q11 (Update Interview Result)
// Allowed results: pending, pass, fail
// Rule: Selected candidates cannot be rescheduled
const updateInterview = async (req, res, next) => {
  try {
    const { result, interviewer, round, scheduledAt } = req.body;

    // Validate result value
    if (result && !["pending", "pass", "fail"].includes(result)) {
      return error(res, 400, "Result must be one of: pending, pass, fail");
    }

    const interview = await Interview.findById(req.params.id).populate("application");
    if (!interview) {
      return error(res, 404, "Interview not found");
    }

    // Rule: Selected candidates cannot be rescheduled
    if (
      interview.application &&
      interview.application.status === "selected" &&
      scheduledAt
    ) {
      return error(res, 400, "Selected candidates cannot be rescheduled");
    }

    const updates = {};
    if (result !== undefined) updates.result = result;
    if (interviewer !== undefined) updates.interviewer = interviewer;
    if (round !== undefined) updates.round = round;
    if (scheduledAt !== undefined) updates.scheduledAt = new Date(scheduledAt);

    const updated = await Interview.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate({
      path: "application",
      populate: [
        { path: "student", select: "name email department" },
        { path: "drive", select: "title", populate: { path: "company", select: "name" } },
      ],
    });

    return success(res, 200, "Interview updated successfully", updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { getInterviews, scheduleInterview, updateInterview };
