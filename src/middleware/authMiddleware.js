const jwt = require("jsonwebtoken");
const { error } = require("../utils/responseHelper");

// Verify JWT token
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error(res, 401, "Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return error(res, 401, "Token has expired. Please login again.");
    }
    return error(res, 401, "Invalid token. Authentication failed.");
  }
};

// Role-based authorization middleware
// Usage: authorizeRoles("admin", "placement_officer")
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 401, "Not authenticated");
    }
    if (!roles.includes(req.user.role)) {
      return error(
        res,
        403,
        `Access denied. Required role: ${roles.join(" or ")}. Your role: ${req.user.role}`
      );
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
