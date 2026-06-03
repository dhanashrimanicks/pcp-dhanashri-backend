const mongoose = require("mongoose");

// Application model — exact fields from SET A question paper
const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      sparse: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drive",
      required: [true, "Drive reference is required"],
    },
    currentRound: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "selected", "rejected", "withdrawn"],
      default: "applied",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicate application (same student + drive)
applicationSchema.index({ student: 1, drive: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
