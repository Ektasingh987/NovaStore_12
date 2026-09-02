'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  googleAuthSchema,
  logoutSchema,
} = require('../validators/auth.validator');

const router = express.Router();

// ─── Per-endpoint rate limiters ───────────────────────────────────────────────

/** Tight limit on register — prevents account farming. */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again in an hour.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
    details: null,
  },
});

/** Tight limit on login — prevents brute-force password attacks. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
    details: null,
  },
});

/** Moderate limit on refresh — prevents token farming. */
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many token refresh attempts. Please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
    details: null,
  },
});

/** Moderate limit on Google auth. */
const googleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many Google auth attempts. Please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
    details: null,
  },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Public — create account + issue tokens
 */
router.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  authController.register,
);

/**
 * POST /api/v1/auth/login
 * Public — authenticate + issue tokens
 */
router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  authController.login,
);

/**
 * POST /api/v1/auth/refresh
 * Semi-public — rotates tokens using httpOnly cookie or body refreshToken
 */
router.post(
  '/refresh',
  refreshLimiter,
  validate(refreshSchema),
  authController.refresh,
);

/**
 * POST /api/v1/auth/google
 * Public — verify Google ID token, create/find user, issue tokens
 */
router.post(
  '/google',
  googleLimiter,
  validate(googleAuthSchema),
  authController.googleAuth,
);

/**
 * POST /api/v1/auth/logout
 * Protected — revoke current session
 * Accepts refresh token from cookie or body (mobile clients must pass it in body)
 */
router.post(
  '/logout',
  protect,
  validate(logoutSchema),
  authController.logout,
);

/**
 * POST /api/v1/auth/logout-all
 * Protected — revoke all sessions for this user
 */
router.post(
  '/logout-all',
  protect,
  authController.logoutAll,
);

/**
 * GET /api/v1/auth/me
 * Protected — return authenticated user profile
 */
router.get(
  '/me',
  protect,
  authController.getMe,
);

module.exports = router;
