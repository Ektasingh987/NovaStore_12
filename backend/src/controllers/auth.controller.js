'use strict';

const authService = require('../services/auth.service');
const { extractRefreshToken, setRefreshCookie, clearRefreshCookie } = require('../utils/cookie');
const { sendSuccess, sendCreated } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the standard auth response data shape.
 * Always returns both token forms:
 *  - accessToken in body (all clients)
 *  - refreshToken in body (mobile clients — should store in flutter_secure_storage)
 *  - refreshToken as httpOnly cookie (web clients — browser handles storage)
 */
const buildAuthResponse = (res, { user, accessToken, rawRefreshToken }) => {
  setRefreshCookie(res, rawRefreshToken);
  return {
    user: user.toPublicJSON ? user.toPublicJSON() : user,
    accessToken,
    refreshToken: rawRefreshToken, // For mobile clients
  };
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Create a new customer account and issue tokens.
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, req);
  const data = buildAuthResponse(res, result);
  return sendCreated(res, { message: 'Account created successfully', data });
});

/**
 * POST /api/v1/auth/login
 * Authenticate with email + password; issue tokens.
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, req);
  const data = buildAuthResponse(res, result);
  return sendSuccess(res, { message: 'Login successful', data });
});

/**
 * POST /api/v1/auth/refresh
 * Rotate the refresh token and issue a new access token.
 * Accepts token via httpOnly cookie (web) or request body (mobile).
 */
const refresh = asyncHandler(async (req, res) => {
  const rawRefreshToken = extractRefreshToken(req);
  const result = await authService.refresh(rawRefreshToken, req);

  setRefreshCookie(res, result.rawRefreshToken);

  return sendSuccess(res, {
    message: 'Tokens refreshed successfully',
    data: {
      user: result.user.toPublicJSON ? result.user.toPublicJSON() : result.user,
      accessToken: result.accessToken,
      refreshToken: result.rawRefreshToken, // For mobile clients
    },
  });
});

/**
 * POST /api/v1/auth/logout
 * Revoke the current device session.
 */
const logout = asyncHandler(async (req, res) => {
  const rawRefreshToken = extractRefreshToken(req);
  await authService.logout(rawRefreshToken);
  clearRefreshCookie(res);
  return sendSuccess(res, { message: 'Logged out successfully' });
});

/**
 * POST /api/v1/auth/logout-all
 * Revoke ALL sessions for the authenticated user (requires access token).
 * Also revokes the current cookie.
 */
const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user._id);
  clearRefreshCookie(res);
  return sendSuccess(res, { message: 'All sessions have been terminated' });
});

/**
 * GET /api/v1/auth/me
 * Return the authenticated user's profile.
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  return sendSuccess(res, {
    data: { user: user.toPublicJSON ? user.toPublicJSON() : user },
  });
});

/**
 * POST /api/v1/auth/google
 * Verify a Google ID token; create or find the user; issue tokens.
 */
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const result = await authService.googleAuth(idToken, req);
  const data = buildAuthResponse(res, result);

  if (result.isNewUser) {
    return sendCreated(res, { message: 'Account created via Google', data });
  }
  return sendSuccess(res, { message: 'Google login successful', data });
});

module.exports = { register, login, refresh, logout, logoutAll, getMe, googleAuth };
