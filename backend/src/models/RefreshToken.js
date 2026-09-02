'use strict';

const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    // Store a hashed version of the token — never the raw JWT
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      select: false, // Excluded from queries by default
    },

    // Token family — shared by all rotations of the same login session.
    // Used to detect replay attacks: presenting an already-rotated token
    // triggers revocation of the entire family.
    tokenFamily: {
      type: String,
      required: [true, 'Token family is required'],
    },

    // Token ID — unique per rotation within a family.
    // Embedded in the refresh JWT payload for O(1) DB lookup.
    tokenId: {
      type: String,
      required: [true, 'Token ID is required'],
    },

    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },

    // Set when token is revoked (logout, password change, etc.)
    revokedAt: {
      type: Date,
      default: null,
    },

    // Optional: device/client info for multi-device session management
    deviceInfo: {
      userAgent: { type: String, default: null },
      ip: { type: String, default: null },
      deviceName: { type: String, default: null },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
refreshTokenSchema.index({ userId: 1 });

// TTL index — MongoDB automatically deletes expired documents
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Primary lookup index: family + tokenId → O(1) rotation lookup
refreshTokenSchema.index({ tokenFamily: 1, tokenId: 1 });

// Family-only index: used for bulk revocation and reuse detection
refreshTokenSchema.index({ tokenFamily: 1 });

// For fast revocation lookups
refreshTokenSchema.index({ userId: 1, revokedAt: 1 });

// ─── Instance method: check if token is still valid ─────────────────────────
refreshTokenSchema.methods.isValid = function () {
  return !this.revokedAt && this.expiresAt > new Date();
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
