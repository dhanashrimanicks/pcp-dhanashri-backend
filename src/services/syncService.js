const axios = require("axios");
const Student = require("../models/Student");
const Company = require("../models/Company");
const Drive = require("../models/Drive");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const SYNC_API_URL = process.env.SYNC_API_URL || "https://t4e-testserver.onrender.com/api";
const SYNC_STUDENT_ID = process.env.SYNC_STUDENT_ID || "SRINATH A";
const SYNC_PASSWORD = process.env.SYNC_PASSWORD || "451408";

// ─── Data Sanitization (Q4 — Section B requirement) ───────────────────────────

/** Capitalize each word: "arun kumar " → "Arun Kumar" */
const capitalizeName = (str) => {
  if (!str || typeof str !== "string") return str;
  return str
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

/** Trim and lowercase email: "ARUN@MAIL.COM" → "arun@mail.com" */
const sanitizeEmail = (str) => {
  if (!str || typeof str !== "string") return str;
  return str.trim().toLowerCase();
};

/** Trim string */
const sanitizeStr = (str) => {
  if (!str || typeof str !== "string") return str;
  return str.trim();
};

/** Trim and uppercase department: "cse " → "CSE" */
const sanitizeDept = (str) => {
  if (!str || typeof str !== "string") return str;
  return str.trim().toUpperCase();
};

// ─── Validation ────────────────────────────────────────────────────────────────

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidCGPA = (cgpa) => typeof cgpa === "number" && cgpa >= 0 && cgpa <= 10;
const isValidDate = (d) => d && !isNaN(new Date(d).getTime());

// ─── Token Fetch ───────────────────────────────────────────────────────────────

const getAuthToken = async () => {
  const payload = {
    studentId: SYNC_STUDENT_ID,
    password: SYNC_PASSWORD,
  };

  const syncSet = process.env.SYNC_SET;
  if (syncSet) payload.set = syncSet;

  console.log("🔄 Sync: Fetching token for", payload.studentId);

  const response = await axios.post(`${SYNC_API_URL}/public/token`, payload);

  return {
    token: response.data.token || response.data.data?.token || response.data.accessToken,
    dataUrl: response.data.dataUrl || "/private/data"
  };
};

// ─── Dataset Fetch ─────────────────────────────────────────────────────────────

const fetchDataset = async (token, dataUrl) => {
  const response = await axios.get(`${SYNC_API_URL}${dataUrl}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data || response.data;
};

// ─── Sync Students ─────────────────────────────────────────────────────────────

const syncStudents = async (students) => {
  let inserted = 0, duplicates = 0, rejected = 0;

  for (const s of students) {
    try {
      // Sanitize
      const name = capitalizeName(s.name);
      const email = sanitizeEmail(s.email);
      const department = sanitizeDept(s.department);
      const studentId = sanitizeStr(s.studentId || s.id || String(s._id));

      // Validate
      if (!studentId || !name || !email) { rejected++; continue; }
      if (!isValidEmail(email)) { rejected++; continue; }
      if (s.cgpa !== undefined && !isValidCGPA(s.cgpa)) { rejected++; continue; }

      const doc = {
        studentId,
        name,
        email,
        phone: sanitizeStr(s.phone) || "",
        cgpa: parseFloat(s.cgpa) || 0,
        department,
        skills: Array.isArray(s.skills) ? s.skills.map(sanitizeStr) : [],
        graduationYear: s.graduationYear || s.batch || null,
        status: s.status || "active",
      };

      const existing = await Student.findOne({ studentId });
      if (existing) {
        duplicates++;
      } else {
        await Student.create(doc);
        inserted++;
      }

      // Create the user login as requested by evaluator rules (runs for both new and existing students)
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(studentId, 10);
        await User.create({
          username: name,
          email: email,
          password: hashedPassword,
          role: "student",
        });
      }
    } catch (e) {
      if (e.code === 11000) { duplicates++; }
      else { rejected++; }
    }
  }

  return { inserted, duplicates, rejected };
};

// ─── Sync Companies ────────────────────────────────────────────────────────────

const syncCompanies = async (companies) => {
  let inserted = 0, duplicates = 0, rejected = 0;

  for (const c of companies) {
    try {
      const name = capitalizeName(c.name);
      const companyId = sanitizeStr(c.companyId || c.id || String(c._id));

      if (!companyId || !name) { rejected++; continue; }

      const doc = {
        companyId,
        name,
        package: c.package || null,
        eligibleDepartments: Array.isArray(c.eligibleDepartments)
          ? c.eligibleDepartments.map(sanitizeDept)
          : [],
        minimumCgpa: c.minimumCgpa || 0,
        driveDate: isValidDate(c.driveDate) ? new Date(c.driveDate) : null,
        status: c.status || "active",
      };

      const existing = await Company.findOne({ companyId });
      if (existing) {
        duplicates++;
      } else {
        await Company.create(doc);
        inserted++;
      }
    } catch (e) {
      if (e.code === 11000) { duplicates++; }
      else { rejected++; }
    }
  }

  return { inserted, duplicates, rejected };
};

// ─── Sync Drives ───────────────────────────────────────────────────────────────

const syncDrives = async (drives) => {
  let inserted = 0, duplicates = 0, rejected = 0;

  for (const d of drives) {
    try {
      const driveId = sanitizeStr(d.driveId || d.id || String(d._id));
      if (!driveId || !d.title) { rejected++; continue; }

      // Find company reference
      let companyRef = null;
      if (d.company && typeof d.company === "object") {
        const fc = await Company.findOne({ name: { $regex: d.company.name, $options: "i" } });
        companyRef = fc?._id;
      } else if (d.companyId) {
        const fc = await Company.findOne({ companyId: d.companyId });
        companyRef = fc?._id;
      } else if (d.company && typeof d.company === "string") {
        const fc = await Company.findOne({ name: { $regex: d.company, $options: "i" } });
        companyRef = fc?._id;
      }

      if (!companyRef) { rejected++; continue; }

      const doc = {
        driveId,
        company: companyRef,
        title: sanitizeStr(d.title),
        mode: d.mode || "offline",
        location: sanitizeStr(d.location) || "",
        registrationDeadline: isValidDate(d.registrationDeadline)
          ? new Date(d.registrationDeadline)
          : null,
        rounds: d.rounds || 1,
        status: d.status || "open",
      };

      const existing = await Drive.findOne({ driveId });
      if (existing) {
        duplicates++;
      } else {
        await Drive.create(doc);
        inserted++;
      }
    } catch (e) {
      if (e.code === 11000) { duplicates++; }
      else { rejected++; }
    }
  }

  return { inserted, duplicates, rejected };
};

// ─── Main Sync ─────────────────────────────────────────────────────────────────

const performSync = async () => {
  const { token, dataUrl } = await getAuthToken();
  const dataset = await fetchDataset(token, dataUrl);

  const students = dataset.students || dataset.Students || [];
  const companies = dataset.companies || dataset.Companies || [];
  const drives = dataset.drives || dataset.Drives || [];

  const totalFetched = students.length + companies.length + drives.length;

  // Sync companies first (drives depend on companies)
  const cResult = await syncCompanies(companies);
  const sResult = await syncStudents(students);
  const dResult = await syncDrives(drives);

  const inserted = sResult.inserted + cResult.inserted + dResult.inserted;
  const duplicates = sResult.duplicates + cResult.duplicates + dResult.duplicates;
  const rejected = sResult.rejected + cResult.rejected + dResult.rejected;

  console.log(`✅ Sync complete: ${inserted} inserted, ${duplicates} duplicates, ${rejected} rejected`);

  return { totalFetched, inserted, duplicates, rejected };
};

module.exports = { performSync };
