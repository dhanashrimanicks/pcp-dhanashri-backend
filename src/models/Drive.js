const mongoose = require("mongoose");

// Drive model — exact fields from SET A question paper
const driveSchema = new mongoose.Schema(
  {
    driveId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company reference is required"],
    },
    title: {
      type: String,
      required: [true, "Drive title is required"],
      trim: true,
    },
    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      default: "offline",
    },
    location: {
      type: String,
      trim: true,
    },
    registrationDeadline: {
      type: Date,
    },
    rounds: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["open", "closed", "completed"],
      default: "open",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Drive", driveSchema);
