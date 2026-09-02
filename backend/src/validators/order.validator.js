'use strict';

const Joi = require('joi');

const addressSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).trim().required().messages({
    'any.required': 'Full name is required for delivery address',
  }),
  phone: Joi.string().trim().required().messages({
    'any.required': 'Phone number is required for delivery address',
  }),
  line1: Joi.string().min(3).max(200).trim().required().messages({
    'any.required': 'Address line 1 is required',
  }),
  line2: Joi.string().max(200).trim().optional().allow(''),
  city: Joi.string().min(2).max(100).trim().required().messages({
    'any.required': 'City is required',
  }),
  state: Joi.string().min(2).max(100).trim().required().messages({
    'any.required': 'State is required',
  }),
  postalCode: Joi.string().min(3).max(20).trim().required().messages({
    'any.required': 'Postal code is required',
  }),
  country: Joi.string().max(100).trim().optional().default('India'),
});

/**
 * POST /api/orders
 */
const createOrderSchema = Joi.object({
  address: addressSchema.required().messages({
    'any.required': 'Delivery address is required',
  }),
  paymentMethod: Joi.string()
    .valid('COD', 'Razorpay', 'Stripe', 'UPI', 'Wallet')
    .required()
    .messages({
      'any.required': 'Payment method is required',
      'any.only': 'Payment method must be one of COD, Razorpay, Stripe, UPI, Wallet',
    }),
  notes: Joi.string().max(500).trim().optional().allow(''),
});

/**
 * GET /api/orders / GET /api/admin/orders
 */
const listOrderQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  status: Joi.string().valid('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled').optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  orderId: Joi.string().trim().optional(),
  search: Joi.string().trim().optional(),
});

/**
 * PATCH /api/admin/orders/:id/status
 */
const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled')
    .required()
    .messages({
      'any.required': 'Order status is required',
      'any.only': 'Status must be one of: Pending, Confirmed, Shipped, Delivered, Cancelled',
    }),
  note: Joi.string().max(300).trim().optional().allow(''),
});

module.exports = {
  createOrderSchema,
  listOrderQuerySchema,
  updateStatusSchema,
};
