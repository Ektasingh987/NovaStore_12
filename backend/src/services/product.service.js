'use strict';

const mongoose    = require('mongoose');
const productRepo = require('../repositories/product.repository');
const AppError    = require('../utils/AppError');
const { uniqueSlug }   = require('../utils/slugify');
const { buildProductQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { deleteUploadedFiles } = require('../utils/fileHelper');
const { uploadMultipleBuffers, deleteMultipleFromCloudinary } = require('../utils/cloudinaryHelper');
const logger = require('../config/logger');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const assertValidId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw AppError.notFound('Product', 'PRODUCT_NOT_FOUND');
};

/**
 * Convert multipart tags field to a proper array.
 * Multipart forms may send tags as a comma-separated string or repeated fields.
 */
const normaliseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => t.trim()).filter(Boolean);
  return String(tags).split(',').map((t) => t.trim()).filter(Boolean);
};

/**
 * Upload image files to Cloudinary and build the images array.
 * @param {Express.Multer.File[]} files
 * @param {string} altText
 */
const uploadAndBuildImages = async (files = [], altText = '') => {
  if (!files || files.length === 0) return [];

  const uploadedResults = await uploadMultipleBuffers(files, { folder: 'products' });
  return uploadedResults.map((result, idx) => ({
    url:       result.url,
    alt:       altText || '',
    isPrimary: idx === 0,
  }));
};

// ─── Service methods ──────────────────────────────────────────────────────────

/**
 * List products with filtering, sorting, and pagination.
 * Capped at 50 items per page.
 */
const getAll = async (query) => {
  const { filter, sort, page, limit, skip } = buildProductQuery(query);

  const [products, total] = await Promise.all([
    productRepo.findAll({ filter, sort, skip, limit }),
    productRepo.countAll(filter),
  ]);

  return {
    products,
    meta: buildPaginationMeta({ total, page, limit }),
  };
};

/**
 * Get a single product by id.
 * Throws 404 if not found or not active.
 */
const getById = async (id) => {
  assertValidId(id);
  const product = await productRepo.findById(id);
  if (!product || !product.isActive)
    throw AppError.notFound('Product', 'PRODUCT_NOT_FOUND');
  return product;
};

/**
 * Create a new product (admin only).
 * - Auto-generates unique slug from name
 * - Stores image URLs built from uploaded files
 */
const create = async (data, imageFiles = []) => {
  const { name, description, price, discount, category, stock, isFeatured, tags } = data;

  // Generate unique slug
  const slug = await uniqueSlug(name, (s) => productRepo.existsBySlug(s));

  // Upload image buffers directly to Cloudinary
  const images = await uploadAndBuildImages(imageFiles, name);

  const product = await productRepo.create({
    name:        name.trim(),
    slug,
    description: description || '',
    price:       Number(price),
    discount:    Number(discount) || 0,
    category,
    stock:       Number(stock)    || 0,
    isFeatured:  Boolean(isFeatured),
    tags:        normaliseTags(tags),
    images,
  });

  logger.info('[Product] Created', { id: product._id, name });
  return productRepo.findById(product._id); // Return populated lean version
};

/**
 * Update an existing product (admin only).
 * - Regenerates slug if name changes
 * - Replaces all images and deletes old Cloudinary files if new images are uploaded
 */
const update = async (id, data, imageFiles = []) => {
  assertValidId(id);

  const existing = await productRepo.findById(id);
  if (!existing) throw AppError.notFound('Product', 'PRODUCT_NOT_FOUND');

  const updateFields = {};

  // Scalar fields
  const scalars = ['description', 'price', 'discount', 'category', 'stock', 'isFeatured', 'isActive'];
  scalars.forEach((field) => {
    if (data[field] !== undefined) updateFields[field] = data[field];
  });

  if (data.tags !== undefined) updateFields.tags = normaliseTags(data.tags);

  // Name change → regenerate slug
  if (data.name !== undefined) {
    updateFields.name = data.name.trim();
    if (updateFields.name !== existing.name) {
      updateFields.slug = await uniqueSlug(data.name, (s) => productRepo.existsBySlug(s, id));
    }
  }

  // New images uploaded → upload new images to Cloudinary and clean up old ones
  if (imageFiles.length > 0) {
    const oldUrls = (existing.images || []).map((img) => img.url);
    await deleteUploadedFiles(oldUrls);
    updateFields.images = await uploadAndBuildImages(imageFiles, updateFields.name || existing.name);
  }

  const updated = await productRepo.updateById(id, updateFields);
  logger.info('[Product] Updated', { id, fields: Object.keys(updateFields) });
  return updated;
};

/**
 * Delete a product and all its associated image files (admin only).
 * Hard-deletes the document.
 */
const remove = async (id) => {
  assertValidId(id);

  const existing = await productRepo.findById(id);
  if (!existing) throw AppError.notFound('Product', 'PRODUCT_NOT_FOUND');

  // Delete all image files from Cloudinary / disk
  const imageUrls = (existing.images || []).map((img) => img.url);
  await deleteUploadedFiles(imageUrls);

  await productRepo.deleteById(id);
  logger.info('[Product] Deleted', { id, name: existing.name });
};

module.exports = { getAll, getById, create, update, remove };
