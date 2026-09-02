'use strict';

const env = require('../config/env');
const { parseExpiryMs } = require('./jwt');

/** The cookie name used for the httpOnly refresh token. */
const REFRESH_COOKIE_NAME = 'refreshToken';

// ─── Cookie options builder ───────────────────────────────────────────────────

const baseCookieOptions = () => ({
  httpOnly: true,                        // Not accessible from JavaScript
  secure: env.COOKIE_SECURE,            // HTTPS-only in production
  sameSite: env.COOKIE_SAME_SITE,       // 'lax' or 'strict'
  path: '/api/v1/auth',                 // Only sent to auth endpoints (minimise exposure)
});

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Attach an httpOnly refresh token cookie to the response.
 * Used by web (browser) clients. Mobile clients read from the response body instead.
 *
 * @param {import('express').Response} res
 * @param {string} rawRefreshToken
 */
const setRefreshCookie = (res, rawRefreshToken) => {
  res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, {
    ...baseCookieOptions(),
    maxAge: parseExpiryMs(env.JWT_REFRESH_EXPIRES_IN), // milliseconds
  });
};

/**
 * Clear the refresh token cookie (called on logout).
 *
 * @param {import('express').Response} res
 */
const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions());
};

/**
 * Extract the raw refresh token from the request.
 * Checks httpOnly cookie first (web clients), then falls back to body (mobile clients).
 *
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const extractRefreshToken = (req) =>
  req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken || null;

module.exports = { REFRESH_COOKIE_NAME, setRefreshCookie, clearRefreshCookie, extractRefreshToken };
