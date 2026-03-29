"use strict";

/**
 * sendSuccess
 * Sends a standard success JSON response.
 * { success: true, data: { ... } }
 */
function sendSuccess(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data,
  });
}

/**
 * sendError
 * Sends a standard error JSON response.
 * { success: false, error: { code, message } }
 */
function sendError(res, message, status = 500, code = "ERROR") {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

/**
 * globalErrorHandler
 * Express global error middleware (must have 4 params).
 * Catches any error passed via next(err).
 */
function globalErrorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error("[GlobalError]", err.message);
  return sendError(
    res,
    err.message || "An unexpected error occurred",
    err.status  || 500,
    err.code    || "INTERNAL_ERROR"
  );
}

module.exports = { sendSuccess, sendError, globalErrorHandler };