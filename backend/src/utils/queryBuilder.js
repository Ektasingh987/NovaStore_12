'use strict';

const mongoose = require('mongoose');

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 50;

/** Valid sort keys for products and their Mongoose sort expressions. */
const PRODUCT_SORT_MAP = {
  price_asc:  { price: 1 },
  price_desc: { price: -1 },
  newest:     { createdAt: -1 },
  oldest:     { createdAt:  1 },
  rating:     { 'rating.average': -1 },
  popular:    { 'rating.count': -1 },
  name_asc:   { name:  1 },
  name_desc:  { name: -1 },
};

// ─── Pagination helpers ───────────────────────────────────────────────────────

/**
 * Parse pagination params from req.query.
 * Clamps limit to [1, MAX_LIMIT].
 *
 * @param {object} query  req.query
 * @returns {{ page, limit, skip }}
 */
const buildPagination = (query = {}) => {
  const page  = Math.max(DEFAULT_PAGE, parseInt(query.page,  10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT,    Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build the standard pagination metadata object for list responses.
 *
 * @param {{ total: number, page: number, limit: number }} p
 * @returns {{ page, limit, totalItems, totalPages, hasNextPage, hasPreviousPage }}
 */
const buildPaginationMeta = ({ total, page, limit }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    totalItems:      total,
    totalPages,
    hasNextPage:     page < totalPages,
    hasPreviousPage: page > 1,
  };
};

// ─── Product query builder ────────────────────────────────────────────────────

/**
 * Build a complete Mongoose query config from product list query params.
 *
 * Handles: search (full-text), category, minPrice, maxPrice, inStock,
 *          isFeatured, sort, pagination.
 *
 * @param {object} query           req.query
 * @param {object} [opts]
 * @param {string} [opts.defaultSort='newest']
 * @returns {{ filter, sort, page, limit, skip }}
 */
const buildProductQuery = (query = {}, opts = {}) => {
  const { defaultSort = 'newest' } = opts;
  const { page, limit, skip } = buildPagination(query);

  const filter = { isActive: true };

  // Full-text search
  if (query.search && String(query.search).trim()) {
    filter.$text = { $search: String(query.search).trim() };
  }

  // Category filter — validate ObjectId before using
  if (query.category && mongoose.Types.ObjectId.isValid(query.category)) {
    filter.category = new mongoose.Types.ObjectId(query.category);
  }

  // Price range
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice !== undefined) filter.price.$lte = Number(query.maxPrice);
  }

  // In-stock
  if (query.inStock === 'true') filter.stock = { $gt: 0 };

  // Featured
  if (query.isFeatured === 'true') filter.isFeatured = true;

  // Sort
  const sort = PRODUCT_SORT_MAP[query.sort] || PRODUCT_SORT_MAP[defaultSort];

  return { filter, sort, page, limit, skip };
};

// ─── Order query builder ──────────────────────────────────────────────────────

/**
 * Build a Mongoose filter for the admin orders list.
 *
 * @param {object} query  req.query
 * @returns {{ filter, sort, page, limit, skip }}
 */
const buildOrderQuery = (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  if (query.status) filter.status = query.status;

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to)   filter.createdAt.$lte = new Date(query.to);
  }

  // Search by order _id
  if (query.orderId && mongoose.Types.ObjectId.isValid(query.orderId)) {
    filter._id = new mongoose.Types.ObjectId(query.orderId);
  }

  const sort = { createdAt: -1 };
  return { filter, sort, page, limit, skip };
};

module.exports = {
  buildPagination,
  buildPaginationMeta,
  buildProductQuery,
  buildOrderQuery,
  MAX_LIMIT,
  PRODUCT_SORT_MAP,
};
