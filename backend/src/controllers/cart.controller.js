'use strict';

const cartService  = require('../services/cart.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendNoContent } = require('../utils/response');

// ─── GET /api/cart ────────────────────────────────────────────────────────────
const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  return sendSuccess(res, { data: { cart } });
});

// ─── POST /api/cart/items ─────────────────────────────────────────────────────
const addItem = asyncHandler(async (req, res) => {
  const cart = await cartService.addItem(req.user._id, req.body);
  return sendSuccess(res, { data: { cart }, message: 'Item added to cart' });
});

// ─── PATCH /api/cart/items/:productId ────────────────────────────────────────
const updateItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateItem(
    req.user._id,
    req.params.productId,
    req.body.quantity,
  );
  return sendSuccess(res, { data: { cart }, message: 'Cart item updated' });
});

// ─── DELETE /api/cart/items/:productId ───────────────────────────────────────
const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user._id, req.params.productId);
  return sendSuccess(res, { data: { cart }, message: 'Item removed from cart' });
});

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────
const clearCart = asyncHandler(async (req, res) => {
  await cartService.clearCart(req.user._id);
  return sendNoContent(res);
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
