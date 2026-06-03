const mongoose = require("mongoose");

// Interview model — exact fields from SET A question paper
const interviewSchema = new mongoose.Schema(
  {
    interviewId: {
      type: String,
      unique: true,
      sparse: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: [true, "Application reference is required"],
    },
    interviewer: {
      type: String,
      trim: true,
    },
    round: {
      type: Number,
      default: 1,
      min: 1,
    },
    scheduledAt: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    result: {
      type: String,
      enum: ["pending", "pass", "fail"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
