const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { success, error } = require("../utils/responseHelper");

// POST /auth/register
const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return error(res, 400, "Username, email, and password are required");
    }

    if (role === "student") {
      return error(res, 403, "Student registration is not allowed. Students are synced via the dataset.");
    }

    // Check for duplicate email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return error(res, 409, "Email already registered");
    }

    // Check for duplicate username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return error(res, 409, "Username already taken");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "user",
    });

    return success(res, 201, "User registered successfully", {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 400, "Email and password are required");
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return error(res, 401, "Invalid email or password");
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return error(res, 401, "Invalid email or password");
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return success(res, 200, "Login successful", {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /auth/me  (protected)
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return error(res, 404, "User not found");
    }

    return success(res, 200, "User profile fetched successfully", {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
