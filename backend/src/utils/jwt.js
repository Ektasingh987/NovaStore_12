'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const AppError = require('./AppError');

// ─── Expiry parser ────────────────────────────────────────────────────────────

/**
 * Convert a JWT expiry string (e.g. "15m", "30d") to milliseconds.
 * @param {string|number} expiresIn
 * @returns {number} milliseconds
 */
const parseExpiryMs = (expiresIn) => {
  if (typeof expiresIn === 'number') return expiresIn * 1000;
  const units = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const match = String(expiresIn).match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Unsupported expiry format: "${expiresIn}"`);
  return parseInt(match[1], 10) * units[match[2]];
};

// ─── Token signing ────────────────────────────────────────────────────────────

/**
 * Sign a short-lived access token.
 * Payload: { sub: userId, role, type: 'access' }
 */
const signAccessToken = (userId, role) =>
  jwt.sign(
    { sub: userId.toString(), role, type: 'access' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );

/**
 * Sign a long-lived refresh token.
 * Payload: { sub: userId, tokenFamily, tokenId, type: 'refresh' }
 *
 * tokenFamily — shared by all rotations of the same login session.
 * tokenId     — unique per rotation; used for O(1) DB lookup.
 */
const signRefreshToken = (userId, tokenFamily, tokenId) =>
  jwt.sign(
    { sub: userId.toString(), tokenFamily, tokenId, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
  );

// ─── Token verification ───────────────────────────────────────────────────────

/**
 * Verify and decode an access token.
 * Throws AppError on invalid / expired tokens.
 * @param {string} token
 * @returns {jwt.JwtPayload}
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      throw AppError.unauthorized('Access token has expired. Please refresh.', 'TOKEN_EXPIRED');
    throw AppError.unauthorized('Invalid access token.', 'INVALID_TOKEN');
  }
};

/**
 * Verify and decode a refresh token.
 * Throws AppError on invalid / expired tokens.
 * @param {string} token
 * @returns {jwt.JwtPayload}
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      throw AppError.unauthorized('Refresh token has expired. Please log in again.', 'REFRESH_TOKEN_EXPIRED');
    throw AppError.unauthorized('Invalid refresh token.', 'INVALID_REFRESH_TOKEN');
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Hash a raw token string with SHA-256.
 * ALWAYS hash before persisting or comparing — never store raw JWTs.
 * @param {string} rawToken
 * @returns {string} hex digest
 */
const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

/**
 * Compute the Date when a refresh token will expire (based on env config).
 * @returns {Date}
 */
const getRefreshTokenExpiresAt = () =>
  new Date(Date.now() + parseExpiryMs(env.JWT_REFRESH_EXPIRES_IN));

module.exports = {
  parseExpiryMs,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiresAt,
};
