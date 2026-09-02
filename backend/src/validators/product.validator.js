'use strict';

const Joi      = require('joi');
const mongoose = require('mongoose');

// ─── Reusable field helpers ───────────────────────────────────────────────────

/** Validates a MongoDB ObjectId string. */
const objectId = Joi.string()
  .custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) return helpers.error('any.invalid');
    return value;
  })
  .messages({ 'any.invalid': '{{#label}} must be a valid ID' });

const VALID_SORT_KEYS = [
  'price_asc', 'price_desc', 'newest', 'oldest',
  'rating', 'popular', 'name_asc', 'name_desc',
];

// ─── Schemas ──────────────────────────────────────────────────────────────────

/**
 * POST /api/products
 * Multipart form — Joi validates non-file fields from req.body.
 */
const createSchema = Joi.object({
  name: Joi.string().min(2).max(200).trim().required(),
  description: Joi.string().max(5000).trim().optional().allow(''),
  price: Joi.number().min(0).required().messages({
    'number.min': 'Price cannot be negative',
    'any.required': 'Price is required',
  }),
  discount: Joi.number().min(0).max(100).optional().default(0),
  category: objectId.required().messages({ 'any.required': 'Category ID is required' }),
  stock: Joi.number().integer().min(0).optional().default(0),
  isFeatured: Joi.boolean().optional().default(false),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim()),
    Joi.string().trim(), // Allow comma-separated string from multipart forms
  ).optional().default([]),
});

/**
 * PATCH /api/products/:id
 * All fields optional; at least one required.
 */
const updateSchema = Joi.object({
  name:        Joi.string().min(2).max(200).trim().optional(),
  description: Joi.string().max(5000).trim().optional().allow(''),
  price:       Joi.number().min(0).optional(),
  discount:    Joi.number().min(0).max(100).optional(),
  category:    objectId.optional(),
  stock:       Joi.number().integer().min(0).optional(),
  isFeatured:  Joi.boolean().optional(),
  isActive:    Joi.boolean().optional(),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim()),
    Joi.string().trim(),
  ).optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * GET /api/products — query string validation.
 * Validates and coerces all accepted filter/sort/pagination params.
 */
const listQuerySchema = Joi.object({
  page:       Joi.number().integer().min(1).optional(),
  limit:      Joi.number().integer().min(1).max(50).optional(),
  search:     Joi.string().max(100).trim().optional().allow(''),
  category:   Joi.string().optional(),
  minPrice:   Joi.number().min(0).optional(),
  maxPrice:   Joi.number().min(0).optional(),
  sort:       Joi.string().valid(...VALID_SORT_KEYS).optional(),
  inStock:    Joi.string().valid('true', 'false').optional(),
  isFeatured: Joi.string().valid('true', 'false').optional(),
}).custom((value, helpers) => {
  if (
    value.minPrice !== undefined &&
    value.maxPrice !== undefined &&
    Number(value.minPrice) > Number(value.maxPrice)
  ) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({ 'any.invalid': 'minPrice cannot be greater than maxPrice' });

module.exports = { createSchema, updateSchema, listQuerySchema };
