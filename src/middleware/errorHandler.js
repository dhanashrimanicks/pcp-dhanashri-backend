const { error } = require("../utils/responseHelper");

const errorHandler = (err, req, res, next) => {
  console.error("Global Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return error(res, 400, messages.join(", "));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return error(res, 409, `Duplicate value for field: ${field}`);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return error(res, 400, `Invalid ID format: ${err.value}`);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return error(res, 401, "Invalid token");
  }

  if (err.name === "TokenExpiredError") {
    return error(res, 401, "Token expired");
  }

  // Default server error
  return error(res, err.statusCode || 500, err.message || "Internal server error");
};

module.exports = errorHandler;
