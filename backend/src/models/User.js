'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const BCRYPT_SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },

    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9\s\-().]{7,20}$/, 'Please provide a valid phone number'],
    },

    role: {
      type: String,
      enum: {
        values: ['customer', 'admin'],
        message: 'Role must be either customer or admin',
      },
      default: 'customer',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Optional — populated for Google OAuth users
    googleId: {
      type: String,
      sparse: true, // allows multiple nulls; only indexes non-null values
      default: null,
    },

    // Profile avatar URL (optional)
    avatar: {
      type: String,
      default: null,
    },

    // Last login timestamp
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: email (unique) and googleId (sparse) indexes are already declared via
// the field options above — no need to repeat them here.
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// ─── Pre-save hook: hash password ────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password was modified (or newly set)
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
  next();
});

// ─── Instance methods ─────────────────────────────────────────────────────────

/**
 * Compare a plain-text password against the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Return a safe user object — never includes password or sensitive fields.
 */
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    isActive: this.isActive,
    avatar: this.avatar,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ─── Prevent accidental password leaks in JSON serialisation ─────────────────
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.googleId;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
