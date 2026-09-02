'use strict';

const Joi      = require('joi');
const mongoose = require('mongoose');

const objectId = Joi.string()
  .custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) return helpers.error('any.invalid');
    return value;
  })
  .messages({ 'any.invalid': '{{#label}} must be a valid ID' });

/**
 * POST /api/cart/items
 */
const addItemSchema = Joi.object({
  productId: objectId.required().messages({ 'any.required': 'Product ID is required' }),
  quantity:  Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
});

/**
 * PATCH /api/cart/items/:productId
 */
const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
});

module.exports = { addItemSchema, updateItemSchema };
