'use strict';

const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Map a Mongoose / MongoDB error to an AppError.
 * @param {Error} err
 * @returns {AppError}
 */
function handleMongoError(err) {
  // Duplicate key (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field];
    return AppError.conflict(
      `Duplicate value for ${field}: "${value}". Please use a different value.`,
      'DUPLICATE_KEY',
    );
  }

  // Mongoose CastError (invalid ObjectId, etc.)
  if (err instanceof mongoose.Error.CastError) {
    return AppError.badRequest(
      `Invalid value for field "${err.path}": "${err.value}"`,
      'INVALID_FIELD',
    );
  }

  // Mongoose ValidationError
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return AppError.validation('Validation failed', details);
  }

  return null; // Not a Mongoose error — caller handles
}

/**
 * Global error-handling middleware.
 * Must have exactly 4 parameters for Express to treat it as an error handler.
 *
 * Response shape:
 * {
 *   success: false,
 *   message: string,
 *   errorCode: string,
 *   details: any | null,
 *   ...(development only) stack: string
 * }
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, _next) => {
  let error = err;

  // ── Convert known Mongoose errors ─────────────────────────────────────────
  const mongoError = handleMongoError(err);
  if (mongoError) error = mongoError;

  // ── Ensure we always have an AppError ─────────────────────────────────────
  if (!(error instanceof AppError)) {
    // Programmer error — log full details but send a generic message
    logger.error('[Error] Unhandled error', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });

    error = new AppError('Something went wrong. Please try again later.', 500, 'INTERNAL_ERROR');
  } else {
    // Operational error — log at appropriate level
    const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
    logger[logLevel](`[Error] ${error.errorCode}`, {
      message: error.message,
      statusCode: error.statusCode,
      url: req.originalUrl,
      method: req.method,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  // ── Build response ────────────────────────────────────────────────────────
  const responseBody = {
    success: false,
    message: error.message,
    errorCode: error.errorCode,
    details: error.details ?? null,
  };

  // Include stack trace ONLY in development — never in production
  if (!isProduction && err.stack) {
    responseBody.stack = err.stack;
  }

  return res.status(error.statusCode || 500).json(responseBody);
};

module.exports = errorMiddleware;
