'use strict';

const crypto = require('crypto');
const {
  signAccessToken,
  signRefreshToken,
  hashToken,
  getRefreshTokenExpiresAt,
} = require('../utils/jwt');
const tokenRepo = require('../repositories/token.repository');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Generate a cryptographically random UUID v4. */
const generateId = () => crypto.randomUUID();

/**
 * Persist a refresh token document and return the raw JWT.
 *
 * @param {object} p
 * @param {import('mongoose').Types.ObjectId} p.userId
 * @param {string} p.tokenFamily
 * @param {string} p.tokenId
 * @param {string} p.role
 * @param {object} [p.deviceInfo]
 * @returns {{ rawRefreshToken: string }}
 */
const _persistRefreshToken = async ({ userId, tokenFamily, tokenId, role, deviceInfo = {} }) => {
  const rawRefreshToken = signRefreshToken(userId, tokenFamily, tokenId);
  const tokenHash = hashToken(rawRefreshToken);

  await tokenRepo.createToken({
    userId,
    tokenHash,
    tokenFamily,
    tokenId,
    expiresAt: getRefreshTokenExpiresAt(),
    deviceInfo: {
      userAgent: deviceInfo.userAgent || null,
      ip: deviceInfo.ip || null,
      deviceName: deviceInfo.deviceName || null,
    },
  });

  return rawRefreshToken;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a brand-new access + refresh token pair for a user.
 * Starts a fresh token family (called on login / register / Google auth).
 *
 * @param {object} user        Mongoose User document
 * @param {object} deviceInfo  { userAgent, ip }
 * @returns {{ accessToken: string, rawRefreshToken: string }}
 */
const createTokenPair = async (user, deviceInfo = {}) => {
  const tokenFamily = generateId(); // New family per login session
  const tokenId = generateId();

  const accessToken = signAccessToken(user._id, user.role);
  const rawRefreshToken = await _persistRefreshToken({
    userId: user._id,
    tokenFamily,
    tokenId,
    role: user.role,
    deviceInfo,
  });

  return { accessToken, rawRefreshToken };
};

/**
 * Rotate a refresh token (called by /refresh endpoint).
 *
 * Rotation steps:
 *   1. Look up DB document by tokenFamily + tokenId (from pre-verified JWT payload)
 *   2. Reuse detection:
 *      - Document not found at all  → 401 (expired/TTL-cleared or forged)
 *      - Document found but revoked → REUSE ATTACK: revoke entire family, 401
 *   3. Hash comparison (defense-in-depth against database substitution)
 *   4. Revoke old document
 *   5. Issue new access + refresh tokens (same family, new tokenId)
 *
 * @param {object} p
 * @param {string} p.rawRefreshToken   The raw JWT string (already verified by caller)
 * @param {{ sub, tokenFamily, tokenId }} p.payload   Decoded JWT payload
 * @param {object} p.user              Mongoose User document (loaded by caller)
 * @param {object} [p.deviceInfo]
 * @returns {{ accessToken: string, rawRefreshToken: string }}
 */
const rotateRefreshToken = async ({ rawRefreshToken, payload, user, deviceInfo = {} }) => {
  const { tokenFamily, tokenId } = payload;

  // ── 1. DB lookup (includes revoked docs for reuse detection) ───────────────
  const tokenDoc = await tokenRepo.findByFamilyAndTokenId(tokenFamily, tokenId);

  if (!tokenDoc) {
    // Token not in DB. Check if the family ever existed.
    const familyDocs = await tokenRepo.findByFamily(tokenFamily);

    if (familyDocs.length > 0) {
      // Family exists but this specific tokenId is gone (TTL deleted a revoked entry,
      // or this is a tokenId that was never issued for this family). Treat as suspicious.
      logger.warn('[Security] Refresh token not found but family exists — possible expired replay', {
        tokenFamily,
        userId: familyDocs[0]?.userId,
      });
      await tokenRepo.revokeFamilyAll(tokenFamily);
    }

    throw AppError.unauthorized('Refresh token is invalid or has expired.', 'INVALID_REFRESH_TOKEN');
  }

  // ── 2. Reuse detection ─────────────────────────────────────────────────────
  if (tokenDoc.revokedAt) {
    logger.warn('[Security] TOKEN REUSE DETECTED — revoking entire family', {
      tokenFamily,
      userId: tokenDoc.userId,
      tokenId,
      revokedAt: tokenDoc.revokedAt,
    });

    // Immediately invalidate ALL sessions in this family
    await tokenRepo.revokeFamilyAll(tokenFamily);

    throw AppError.unauthorized(
      'Security alert: this session token was already used. All sessions for this device have been invalidated. Please log in again.',
      'TOKEN_REUSE_DETECTED',
    );
  }

  // ── 3. Hash comparison (defense-in-depth) ─────────────────────────────────
  const incomingHash = hashToken(rawRefreshToken);
  if (incomingHash !== tokenDoc.tokenHash) {
    logger.warn('[Security] Refresh token hash mismatch', { tokenFamily, userId: tokenDoc.userId });
    throw AppError.unauthorized('Invalid refresh token.', 'INVALID_REFRESH_TOKEN');
  }

  // ── 4. Revoke the consumed token ───────────────────────────────────────────
  await tokenRepo.revokeById(tokenDoc._id);

  // ── 5. Issue new pair (same family, fresh tokenId) ─────────────────────────
  const newTokenId = generateId();
  const accessToken = signAccessToken(user._id, user.role);
  const newRawRefreshToken = await _persistRefreshToken({
    userId: user._id,
    tokenFamily,   // Keep the same family
    tokenId: newTokenId,
    role: user.role,
    deviceInfo,
  });

  return { accessToken, rawRefreshToken: newRawRefreshToken };
};

/**
 * Revoke a single refresh token session (normal logout).
 * Best-effort — silently ignores tokens that are already expired/invalid.
 *
 * @param {string} rawRefreshToken
 */
const revokeRefreshToken = async (rawRefreshToken, payload) => {
  const { tokenFamily, tokenId } = payload;
  const tokenDoc = await tokenRepo.findByFamilyAndTokenId(tokenFamily, tokenId);
  if (tokenDoc && !tokenDoc.revokedAt) {
    await tokenRepo.revokeById(tokenDoc._id);
  }
};

/**
 * Revoke ALL refresh token sessions for a user (logout-all / password change).
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 */
const revokeAllUserTokens = (userId) => tokenRepo.revokeAllByUser(userId);

module.exports = {
  createTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};
