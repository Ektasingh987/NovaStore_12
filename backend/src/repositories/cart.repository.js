'use strict';

const Cart = require('../models/Cart');

// ─── Population spec ──────────────────────────────────────────────────────────

/** Fields to populate on productId for every cart read. */
const PRODUCT_PROJECTION = 'name price discount stock images isActive slug';

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Find cart for a user and populate product details.
 * Returns a lean plain object (read-only).
 */
const findByUserId = (userId) =>
  Cart.findOne({ userId })
    .populate('items.productId', PRODUCT_PROJECTION)
    .lean();

/**
 * Find the raw Mongoose document (writable) — used for item mutation.
 */
const findDocByUserId = (userId) =>
  Cart.findOne({ userId });

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Add an item to the cart or update its quantity if it already exists.
 * If the cart doesn't exist yet, it is created (upsert).
 *
 * Strategy: Load → mutate in memory → save.
 * This allows Mongoose's pre-save hooks (subtotal / itemCount) to run.
 *
 * @param {ObjectId|string} userId
 * @param {ObjectId|string} productId
 * @param {number} quantity
 * @param {number} priceAtAdd  Server-side price at the time of add
 */
const upsertItem = async (userId, productId, quantity, priceAtAdd) => {
  let cart = await findDocByUserId(userId);

  if (!cart) {
    // Create new cart with this single item
    return Cart.create({
      userId,
      items: [{ productId, quantity, priceAtAdd }],
    });
  }

  const existingIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId.toString(),
  );

  if (existingIndex > -1) {
    cart.items[existingIndex].quantity   = quantity;
    cart.items[existingIndex].priceAtAdd = priceAtAdd;
  } else {
    cart.items.push({ productId, quantity, priceAtAdd });
  }

  return cart.save();
};

/**
 * Remove a single item from the cart.
 * Returns the updated lean cart (or null if cart doesn't exist).
 */
const removeItem = async (userId, productId) => {
  const cart = await findDocByUserId(userId);
  if (!cart) return null;

  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== productId.toString(),
  );

  await cart.save();
  // Return populated lean version
  return findByUserId(userId);
};

/**
 * Clear all items in the cart.
 * Accepts an optional Mongoose session (for use inside order transactions).
 */
const clearCart = (userId, session = null) => {
  const options = { new: true };
  if (session) options.session = session;

  return Cart.findOneAndUpdate(
    { userId },
    { $set: { items: [], itemCount: 0, subtotal: 0 } },
    options,
  );
};

module.exports = {
  findByUserId,
  findDocByUserId,
  upsertItem,
  removeItem,
  clearCart,
};
