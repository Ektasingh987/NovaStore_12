'use strict';

const Joi = require('joi');

// ─── Reusable field definitions ───────────────────────────────────────────────

const emailField = Joi.string()
  .email({ tlds: { allow: false } })
  .lowercase()
  .trim()
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  });

const passwordField = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
    'any.required': 'Password is required',
  });

// ─── Schemas ──────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 */
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  email: emailField,
  password: passwordField,
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[0-9\s\-().]{7,20}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Please provide a valid phone number' }),
});

/**
 * POST /api/v1/auth/login
 */
const loginSchema = Joi.object({
  email: emailField,
  // No strength rules on login — just require a non-empty string
  password: Joi.string().required().messages({ 'any.required': 'Password is required' }),
});

/**
 * POST /api/v1/auth/refresh
 * refreshToken is optional in body — it may arrive via httpOnly cookie instead.
 */
const refreshSchema = Joi.object({
  refreshToken: Joi.string().optional(),
});

/**
 * POST /api/v1/auth/google
 */
const googleAuthSchema = Joi.object({
  idToken: Joi.string().required().messages({ 'any.required': 'Google ID token is required' }),
});

/**
 * POST /api/v1/auth/logout  /  /logout-all
 * refreshToken is optional in body — it may arrive via httpOnly cookie.
 */
const logoutSchema = Joi.object({
  refreshToken: Joi.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  googleAuthSchema,
  logoutSchema,
};
