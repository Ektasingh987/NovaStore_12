'use strict';

const Joi = require('joi');

/**
 * PATCH /api/users/me
 */
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().optional(),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Phone number must be exactly 10 digits',
    }),
}).min(1).messages({
  'object.min': 'At least one field (name, phone) must be provided for update',
});

/**
 * GET /api/admin/users
 */
const listUserQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  search: Joi.string().trim().max(100).optional().allow(''),
  role: Joi.string().valid('customer', 'admin').optional(),
  isActive: Joi.string().valid('true', 'false').optional(),
  sort: Joi.string().valid('newest', 'oldest', 'name_asc', 'name_desc').optional(),
});

/**
 * PATCH /api/admin/users/:id/status
 */
const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'any.required': 'isActive boolean field is required',
  }),
});

module.exports = {
  updateProfileSchema,
  listUserQuerySchema,
  updateUserStatusSchema,
};
