'use strict';

const mongoose = require('mongoose');
const Product  = require('../models/Product');

// ─── Read queries ─────────────────────────────────────────────────────────────

/**
 * List products with filter + sort + pagination.
 * Uses .lean() for read-only performance.
 *
 * @param {{ filter, sort, skip, limit }} opts
 */
const findAll = ({ filter, sort, skip, limit }) =>
  Product.find(filter)
    .populate('category', 'name slug _id')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

/** Count products matching a filter. */
const countAll = (filter) => Product.countDocuments(filter);

/** Find a product by id, populated with category. Returns lean object. */
const findById = (id) =>
  Product.findById(id)
    .populate('category', 'name slug _id')
    .lean();

/** Find an active product by URL slug. Returns lean object. */
const findBySlug = (slug) =>
  Product.findOne({ slug, isActive: true })
    .populate('category', 'name slug _id')
    .lean();

// ─── Write operations ─────────────────────────────────────────────────────────

/** Create a new product. Returns the Mongoose document (not lean). */
const create = (data) => Product.create(data);

/**
 * Update a product by id.
 * Returns the updated document (not lean) so callers can continue chaining.
 */
const updateById = (id, update) =>
  Product.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });

/** Hard-delete a product document. */
const deleteById = (id) => Product.findByIdAndDelete(id);

// ─── Utility checks ───────────────────────────────────────────────────────────

/** Count active products in a category — used to block category deletion. */
const countByCategory = (categoryId) =>
  Product.countDocuments({ category: categoryId, isActive: true });

/** Check if a slug is taken, optionally excluding the current product. */
const existsBySlug = async (slug, excludeId = null) => {
  const query = { slug };
  if (excludeId) query._id = { $ne: excludeId };
  return (await Product.countDocuments(query)) > 0;
};

// ─── Stock management (used in order transactions) ────────────────────────────

/**
 * Atomically decrement stock.
 * Uses a conditional update { stock: { $gte: quantity } } so stock can never go negative.
 * Returns null if stock is insufficient (update matched 0 documents).
 *
 * @param {ObjectId|string} productId
 * @param {number} quantity
 * @param {import('mongoose').ClientSession|null} session
 */
const decrementStock = (productId, quantity, session = null) => {
  const options = { new: true };
  if (session) options.session = session;

  return Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    options,
  );
};

/**
 * Increment stock (called on order cancellation to restore stock).
 *
 * @param {ObjectId|string} productId
 * @param {number} quantity
 * @param {import('mongoose').ClientSession|null} session
 */
const incrementStock = (productId, quantity, session = null) => {
  const options = { new: true };
  if (session) options.session = session;

  return Product.findByIdAndUpdate(
    productId,
    { $inc: { stock: quantity } },
    options,
  );
};

module.exports = {
  findAll,
  countAll,
  findById,
  findBySlug,
  create,
  updateById,
  deleteById,
  countByCategory,
  existsBySlug,
  decrementStock,
  incrementStock,
};
