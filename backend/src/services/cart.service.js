'use strict';

const mongoose   = require('mongoose');
const cartRepo   = require('../repositories/cart.repository');
const productRepo = require('../repositories/product.repository');
const AppError   = require('../utils/AppError');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const assertValidId = (id, label = 'Product ID') => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw AppError.badRequest(`${label} is invalid.`, 'INVALID_ID');
};

/**
 * Load a product from DB and validate it is available with sufficient stock.
 * Throws AppError if not found, inactive, or insufficient stock.
 *
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<object>} Lean product document
 */
const loadAndValidateProduct = async (productId, quantity) => {
  const product = await productRepo.findById(productId);

  if (!product || !product.isActive) {
    throw AppError.notFound('Product', 'PRODUCT_NOT_FOUND');
  }
  if (product.stock < quantity) {
    throw AppError.conflict(
      `Insufficient stock for "${product.name}". Only ${product.stock} unit(s) available.`,
      'INSUFFICIENT_STOCK',
    );
  }
  return product;
};

// ─── Service methods ──────────────────────────────────────────────────────────

/**
 * GET /api/cart
 * Return the user's cart (empty structure if none exists yet).
 */
const getCart = async (userId) => {
  const cart = await cartRepo.findByUserId(userId);
  // Return a predictable shape even if the cart doesn't exist yet
  return cart || { userId, items: [], itemCount: 0, subtotal: 0 };
};

/**
 * POST /api/cart/items
 * Add a product to the cart or increment/set its quantity.
 * Price is ALWAYS taken from the Product document — never from the client.
 */
const addItem = async (userId, { productId, quantity }) => {
  assertValidId(productId);

  const product = await loadAndValidateProduct(productId, quantity);

  // Use current product price (server-side — never trust client price)
  await cartRepo.upsertItem(userId, productId, quantity, product.price);

  return cartRepo.findByUserId(userId);
};

/**
 * PATCH /api/cart/items/:productId
 * Update the quantity of an existing cart item.
 * Validates stock availability against the new quantity.
 */
const updateItem = async (userId, productId, quantity) => {
  assertValidId(productId);

  // Stock check against new quantity
  const product = await loadAndValidateProduct(productId, quantity);

  // Verify the item is actually in the cart
  const cart = await cartRepo.findByUserId(userId);
  if (!cart) throw AppError.notFound('Cart', 'CART_NOT_FOUND');

  const itemInCart = cart.items.some((item) => {
    // After populate, item.productId is an object; before, it's an ObjectId
    const id = item.productId?._id || item.productId;
    return id.toString() === productId.toString();
  });
  if (!itemInCart) throw AppError.notFound('Item in cart', 'CART_ITEM_NOT_FOUND');

  await cartRepo.upsertItem(userId, productId, quantity, product.price);

  return cartRepo.findByUserId(userId);
};

/**
 * DELETE /api/cart/items/:productId
 * Remove a single item from the cart.
 */
const removeItem = async (userId, productId) => {
  assertValidId(productId);
  const cart = await cartRepo.removeItem(userId, productId);
  return cart || { userId, items: [], itemCount: 0, subtotal: 0 };
};

/**
 * DELETE /api/cart
 * Clear the entire cart.
 */
const clearCart = async (userId) => {
  await cartRepo.clearCart(userId);
  return { userId, items: [], itemCount: 0, subtotal: 0 };
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
