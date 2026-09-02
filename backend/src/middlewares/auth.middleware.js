'use strict';

/**
 * auth.middleware.js
 *
 * Provides Express middleware for JWT-based authentication and role-based
 * access control (RBAC).
 *
 * Exports:
 *   protect      — Require a valid access token; attaches req.user
 *   requireAdmin — Require role === 'admin' (use AFTER protect)
 *   optionalAuth — Attach user if token present; don't block if missing
 */

const User = require('../models/User');
const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');

// ─── Token extraction helper ──────────────────────────────────────────────────

/**
 * Extract the Bearer token from the Authorization header.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const extractBearerToken = (req) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
};

// ─── protect ─────────────────────────────────────────────────────────────────

/**
 * Verifies the access token from the Authorization header and attaches the
 * full user document to req.user.
 *
 * Also checks that:
 *   - The token is a valid, non-expired access token
 *   - The user still exists in the database
 *   - The user account is active (isActive = true)
 *
 * This DB check (rather than trusting the JWT payload alone) ensures that:
 *   - Deactivated accounts cannot use valid tokens
 *   - Deleted accounts are rejected immediately
 *
 * @type {import('express').RequestHandler}
 */
const protect = asyncHandler(async (req, _res, next) => {
  const rawToken = extractBearerToken(req);

  if (!rawToken) {
    return next(AppError.unauthorized('Access token required. Please log in.', 'NO_TOKEN'));
  }

  // Throws a descriptive AppError on invalid / expired tokens
  const payload = verifyAccessToken(rawToken);

  // Validate payload type (defence against accidentally passing a refresh token)
  if (payload.type !== 'access') {
    return next(AppError.unauthorized('Invalid token type.', 'INVALID_TOKEN'));
  }

  // Fetch user from DB — ensures account still exists and is active
  const user = await User.findById(payload.sub).select('-password');

  if (!user) {
    return next(AppError.unauthorized('The account associated with this token no longer exists.', 'USER_NOT_FOUND'));
  }

  if (!user.isActive) {
    return next(
      AppError.unauthorized(
        'Your account has been deactivated. Please contact support.',
        'ACCOUNT_DEACTIVATED',
      ),
    );
  }

  req.user = user;
  return next();
});

// ─── requireAdmin ─────────────────────────────────────────────────────────────

/**
 * Enforce admin-only access.
 * MUST be chained after protect (which populates req.user).
 *
 * @example
 *   router.delete('/products/:id', protect, requireAdmin, handler);
 *
 * @type {import('express').RequestHandler}
 */
const requireAdmin = (req, _res, next) => {
  if (!req.user) {
    return next(AppError.unauthorized('Authentication required.', 'UNAUTHORIZED'));
  }
  if (req.user.role !== 'admin') {
    return next(
      AppError.forbidden(
        'Admin access required. You do not have permission to perform this action.',
        'ADMIN_REQUIRED',
      ),
    );
  }
  return next();
};

// ─── restrictTo ──────────────────────────────────────────────────────────────

/**
 * Role-based access guard — allows any of the specified roles.
 * MUST be chained after protect.
 *
 * @param {...string} roles  Allowed roles (e.g. 'admin', 'customer')
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.get('/admin/orders', protect, restrictTo('admin'), handler);
 */
const restrictTo = (...roles) => (req, _res, next) => {
  if (!req.user) return next(AppError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(
      AppError.forbidden(
        `Access restricted to: ${roles.join(', ')}. Your role: ${req.user.role}.`,
        'INSUFFICIENT_ROLE',
      ),
    );
  }
  return next();
};

// ─── optionalAuth ─────────────────────────────────────────────────────────────

/**
 * Attach user to req.user if a valid access token is present.
 * Passes through WITHOUT error if the token is absent or invalid.
 *
 * Useful for public endpoints that personalise responses for logged-in users
 * (e.g., showing "Add to cart" vs "Login to buy").
 *
 * @type {import('express').RequestHandler}
 */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const rawToken = extractBearerToken(req);
  if (!rawToken) return next();

  try {
    const payload = verifyAccessToken(rawToken);
    if (payload.type !== 'access') return next();

    const user = await User.findById(payload.sub).select('-password');
    if (user && user.isActive) req.user = user;
  } catch {
    // Swallow errors — token is optional
  }

  return next();
});

module.exports = { protect, requireAdmin, restrictTo, optionalAuth };
