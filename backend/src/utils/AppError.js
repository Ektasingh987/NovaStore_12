'use strict';

/**
 * AppError — Operational error class.
 *
 * Only throw this for expected, "safe" errors (validation failures,
 * not-found, auth errors, etc.).  Programmer errors should be uncaught
 * so they surface as 500s without leaking internal details.
 *
 * @example
 *   throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
 */
class AppError extends Error {
  /**
   * @param {string} message     Human-readable message (safe to send to client)
   * @param {number} statusCode  HTTP status code (default 500)
   * @param {string} errorCode   Machine-readable code (e.g. 'USER_NOT_FOUND')
   * @param {unknown} [details]  Optional extra context (validation errors, etc.)
   */
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // Distinguishes from programmer errors

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// ─── Convenience factory helpers ──────────────────────────────────────────────

/** 400 Bad Request */
AppError.badRequest = (message, errorCode = 'BAD_REQUEST', details = null) =>
  new AppError(message, 400, errorCode, details);

/** 401 Unauthorized */
AppError.unauthorized = (message = 'Unauthorized', errorCode = 'UNAUTHORIZED') =>
  new AppError(message, 401, errorCode);

/** 403 Forbidden */
AppError.forbidden = (message = 'Forbidden', errorCode = 'FORBIDDEN') =>
  new AppError(message, 403, errorCode);

/** 404 Not Found */
AppError.notFound = (resource = 'Resource', errorCode = 'NOT_FOUND') =>
  new AppError(`${resource} not found`, 404, errorCode);

/** 409 Conflict */
AppError.conflict = (message, errorCode = 'CONFLICT') =>
  new AppError(message, 409, errorCode);

/** 422 Unprocessable Entity */
AppError.validation = (message, details = null) =>
  new AppError(message, 422, 'VALIDATION_ERROR', details);

/** 429 Too Many Requests */
AppError.tooManyRequests = (message = 'Too many requests, please try again later') =>
  new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');

/** 500 Internal Server Error */
AppError.internal = (message = 'Internal server error') =>
  new AppError(message, 500, 'INTERNAL_ERROR');

module.exports = AppError;
