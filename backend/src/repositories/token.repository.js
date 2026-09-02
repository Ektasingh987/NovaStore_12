'use strict';

const RefreshToken = require('../models/RefreshToken');

/**
 * Persist a new refresh token document.
 * @param {object} data  { userId, tokenHash, tokenFamily, tokenId, expiresAt, deviceInfo }
 */
const createToken = (data) => RefreshToken.create(data);

/**
 * Find a token document by family + tokenId.
 * Returns BOTH active AND revoked documents — we need to see revoked ones
 * to detect replay attacks (reuse detection).
 * Selects the tokenHash field for hash comparison.
 *
 * @param {string} tokenFamily
 * @param {string} tokenId
 */
const findByFamilyAndTokenId = (tokenFamily, tokenId) =>
  RefreshToken.findOne({ tokenFamily, tokenId }).select('+tokenHash');

/**
 * Find ALL documents belonging to a token family (active + revoked).
 * Used during reuse detection to check if the family has ever been issued.
 *
 * @param {string} tokenFamily
 */
const findByFamily = (tokenFamily) => RefreshToken.find({ tokenFamily });

/**
 * Revoke a single token by its MongoDB _id (normal logout / token rotation).
 * @param {import('mongoose').Types.ObjectId} id
 */
const revokeById = (id) =>
  RefreshToken.findByIdAndUpdate(id, { $set: { revokedAt: new Date() } });

/**
 * Revoke every active token in a family (compromise response / reuse detection).
 * @param {string} tokenFamily
 */
const revokeFamilyAll = (tokenFamily) =>
  RefreshToken.updateMany(
    { tokenFamily, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

/**
 * Revoke ALL active refresh tokens for a user (logout-all / password change).
 * @param {string|import('mongoose').Types.ObjectId} userId
 */
const revokeAllByUser = (userId) =>
  RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

module.exports = {
  createToken,
  findByFamilyAndTokenId,
  findByFamily,
  revokeById,
  revokeFamilyAll,
  revokeAllByUser,
};
