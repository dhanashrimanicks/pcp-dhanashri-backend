const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    cgpa: {
      type: Number,
      required: [true, "CGPA is required"],
      min: 0,
      max: 10,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    skills: [{ type: String }],
    graduationYear: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["active", "placed", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
