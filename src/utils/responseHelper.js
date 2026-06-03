/**
 * responseHelper.js
 * Centralised response format for SET A — must match:
 * Success: { success: true, message, data }
 * Error:   { success: false, message }
 */

const success = (res, statusCode, message, data) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const error = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { success, error };
