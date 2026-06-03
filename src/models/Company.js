const mongoose = require("mongoose");

// Company model — exact fields from SET A question paper
const companySchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    package: {
      type: Number, // CTC in LPA
    },
    eligibleDepartments: [
      {
        type: String,
        trim: true,
      },
    ],
    minimumCgpa: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    driveDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
