'use strict';

const Joi = require('joi');

// ─── Shared ───────────────────────────────────────────────────────────────────

const nameField = Joi.string().min(2).max(100).trim();

// ─── Schemas ──────────────────────────────────────────────────────────────────

/**
 * POST /api/categories
 */
const createSchema = Joi.object({
  name: nameField.required().messages({
    'string.min': 'Category name must be at least 2 characters',
    'any.required': 'Category name is required',
  }),
  description: Joi.string().max(500).trim().optional().allow(''),
  isActive: Joi.boolean().optional().default(true),
});

/**
 * PATCH /api/categories/:id
 * At least one field must be present.
 */
const updateSchema = Joi.object({
  name: nameField.optional(),
  description: Joi.string().max(500).trim().optional().allow(''),
  isActive: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

module.exports = { createSchema, updateSchema };
