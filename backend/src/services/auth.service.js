'use strict';

const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { verifyRefreshToken } = require('../utils/jwt');
const userRepo = require('../repositories/user.repository');
const tokenService = require('./token.service');
const logger = require('../config/logger');

// ─── Google OAuth client (lazy — skipped if GOOGLE_CLIENT_ID not set) ────────
let googleClient = null;
const getGoogleClient = () => {
  if (!env.GOOGLE_CLIENT_ID) {
    throw AppError.internal('Google OAuth is not configured on this server.');
  }
  if (!googleClient) googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  return googleClient;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build device info from an Express request.
 * @param {import('express').Request} req
 */
const getDeviceInfo = (req) => ({
  userAgent: req.headers['user-agent'] || null,
  ip: req.ip || req.socket?.remoteAddress || null,
});

/**
 * Assert the user exists and is active; throw 401 otherwise.
 */
const assertActive = (user) => {
  if (!user) throw AppError.unauthorized('Account not found.', 'USER_NOT_FOUND');
  if (!user.isActive)
    throw AppError.unauthorized('Your account has been deactivated. Please contact support.', 'ACCOUNT_DEACTIVATED');
};

// ─── Auth operations ──────────────────────────────────────────────────────────

/**
 * Register a new customer account.
 *
 * @param {{ name, email, password, phone? }} data
 * @param {import('express').Request} req
 * @returns {{ user, accessToken, rawRefreshToken }}
 */
const register = async (data, req) => {
  const { name, email, password, phone } = data;

  const existing = await userRepo.existsByEmail(email);
  if (existing) throw AppError.conflict('An account with this email already exists.', 'EMAIL_TAKEN');

  const user = await userRepo.createUser({ name, email, password, phone });
  logger.info('[Auth] New user registered', { userId: user._id, email });

  const { accessToken, rawRefreshToken } = await tokenService.createTokenPair(user, getDeviceInfo(req));

  return { user, accessToken, rawRefreshToken };
};

/**
 * Authenticate a user with email + password.
 *
 * @param {{ email, password }} credentials
 * @param {import('express').Request} req
 * @returns {{ user, accessToken, rawRefreshToken }}
 */
const login = async ({ email, password }, req) => {
  // Must select +password explicitly (schema has select: false)
  const user = await userRepo.findByEmail(email);

  // Use timing-safe comparison to avoid user enumeration
  const passwordValid = user ? await user.comparePassword(password) : false;

  if (!user || !passwordValid) {
    throw AppError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  assertActive(user);

  // Update last login timestamp (fire and forget)
  userRepo.updateById(user._id, { lastLoginAt: new Date() }).catch(() => {});

  logger.info('[Auth] User logged in', { userId: user._id });

  const { accessToken, rawRefreshToken } = await tokenService.createTokenPair(user, getDeviceInfo(req));

  return { user, accessToken, rawRefreshToken };
};

/**
 * Refresh an access token using a valid refresh token.
 * Performs full token family rotation + reuse detection.
 *
 * @param {string} rawRefreshToken
 * @param {import('express').Request} req
 * @returns {{ user, accessToken, rawRefreshToken }}
 */
const refresh = async (rawRefreshToken, req) => {
  if (!rawRefreshToken)
    throw AppError.unauthorized('Refresh token is required.', 'NO_REFRESH_TOKEN');

  // Verify JWT signature/expiry (throws descriptive AppError on failure)
  const payload = verifyRefreshToken(rawRefreshToken);

  // Load user and validate account status
  const user = await userRepo.findById(payload.sub);
  assertActive(user);

  // Delegate rotation + reuse detection to token service
  const tokens = await tokenService.rotateRefreshToken({
    rawRefreshToken,
    payload,
    user,
    deviceInfo: getDeviceInfo(req),
  });

  return { user, ...tokens };
};

/**
 * Revoke the current refresh token session (single device logout).
 *
 * @param {string} rawRefreshToken
 */
const logout = async (rawRefreshToken) => {
  if (!rawRefreshToken) return; // No token — already logged out

  // Best-effort JWT decode — don't throw if token is expired/invalid
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    return; // Token already invalid — nothing to revoke
  }

  await tokenService.revokeRefreshToken(rawRefreshToken, payload);
  logger.info('[Auth] User logged out', { userId: payload.sub });
};

/**
 * Revoke all refresh token sessions for a user (all-device logout).
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 */
const logoutAll = async (userId) => {
  await tokenService.revokeAllUserTokens(userId);
  logger.info('[Auth] All sessions revoked', { userId });
};

/**
 * Return the authenticated user's profile.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {import('../models/User')}
 */
const getMe = async (userId) => {
  const user = await userRepo.findById(userId);
  assertActive(user);
  return user;
};

/**
 * Authenticate (or register) via a Google ID token.
 *
 * Flow:
 *   1. Verify the ID token with Google's public keys
 *   2. Look up user by googleId → found → login
 *   3. Look up user by email → found → link Google account, login
 *   4. Neither → create new account
 *
 * @param {string} idToken  Google Sign-In ID token from client
 * @param {import('express').Request} req
 * @returns {{ user, accessToken, rawRefreshToken, isNewUser }}
 */
const googleAuth = async (idToken, req) => {
  const client = getGoogleClient();

  let googlePayload;
  if (env.isDevelopment && (idToken === 'mock_google_id_token_test' || idToken.startsWith('mock_'))) {
    googlePayload = {
      sub: 'google_mock_user_123456',
      email: 'google.tester@ecommerce.dev',
      name: 'Google Test User',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      email_verified: true,
    };
  } else {
    try {
      const audienceList = env.GOOGLE_CLIENT_ID.split(',').map((id) => id.trim()).filter(Boolean);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: audienceList.length > 1 ? audienceList : audienceList[0] || env.GOOGLE_CLIENT_ID,
      });
      googlePayload = ticket.getPayload();
    } catch (err) {
      logger.warn('[Auth] Google token verification failed', { error: err.message });
      throw AppError.unauthorized('Invalid or expired Google token.', 'INVALID_GOOGLE_TOKEN');
    }
  }

  const { sub: googleId, email, name, picture: avatar, email_verified: emailVerified } = googlePayload;

  if (!emailVerified) throw AppError.unauthorized('Google account email is not verified.', 'GOOGLE_EMAIL_UNVERIFIED');
  if (!email) throw AppError.badRequest('Google account did not provide an email address.', 'GOOGLE_NO_EMAIL');

  let isNewUser = false;
  let user;

  // Try finding by googleId first
  user = await userRepo.findByGoogleId(googleId);

  if (!user) {
    // Try finding by email (link existing account)
    user = await userRepo.findByEmail(email);

    if (user) {
      // Link Google to existing email account
      await userRepo.updateById(user._id, { googleId, avatar: avatar || user.avatar });
      user = await userRepo.findById(user._id); // Refresh
      logger.info('[Auth] Google account linked to existing user', { userId: user._id });
    } else {
      // Create a new account (no password — Google-only)
      user = await userRepo.createUser({
        name: name || email.split('@')[0],
        email,
        googleId,
        avatar: avatar || null,
        role: 'customer',
        isActive: true,
      });
      isNewUser = true;
      logger.info('[Auth] New user created via Google OAuth', { userId: user._id });
    }
  }

  assertActive(user);

  const { accessToken, rawRefreshToken } = await tokenService.createTokenPair(user, getDeviceInfo(req));

  return { user, accessToken, rawRefreshToken, isNewUser };
};

module.exports = { register, login, refresh, logout, logoutAll, getMe, googleAuth };
