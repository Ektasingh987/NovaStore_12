'use strict';

const mongoose    = require('mongoose');
const categoryRepo = require('../repositories/category.repository');
const productRepo  = require('../repositories/product.repository');
const AppError    = require('../utils/AppError');
const { uniqueSlug } = require('../utils/slugify');
const { deleteUploadedFile } = require('../utils/fileHelper');
const { uploadBufferToCloudinary } = require('../utils/cloudinaryHelper');
const logger      = require('../config/logger');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const assertValidId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw AppError.notFound('Category', 'CATEGORY_NOT_FOUND');
};

// ─── Service methods ──────────────────────────────────────────────────────────

/** Return all active categories (sorted by name). */
const getAll = () => categoryRepo.findAll({ isActive: true });

/** Return a single category by id. Throws 404 if not found. */
const getById = async (id) => {
  assertValidId(id);
  const category = await categoryRepo.findById(id);
  if (!category) throw AppError.notFound('Category', 'CATEGORY_NOT_FOUND');
  return category;
};

/**
 * Create a new category.
 * - Checks for duplicate name (case-insensitive)
 * - Auto-generates a unique slug
 * - Uploads image to Cloudinary if provided
 */
const create = async (data, imageFile) => {
  const { name, description, isActive } = data;

  // Duplicate name check
  if (await categoryRepo.existsByName(name)) {
    throw AppError.conflict(
      `A category named "${name}" already exists.`,
      'CATEGORY_NAME_TAKEN',
    );
  }

  // Generate unique slug from name
  const slug = await uniqueSlug(name, (s) => categoryRepo.existsBySlug(s));

  let imageUrl = null;
  if (imageFile && imageFile.buffer) {
    const uploaded = await uploadBufferToCloudinary(imageFile.buffer, { folder: 'categories' });
    imageUrl = uploaded.url;
  }

  const category = await categoryRepo.create({
    name: name.trim(),
    slug,
    description: description || '',
    image: imageUrl,
    isActive: isActive !== undefined ? isActive : true,
  });

  logger.info('[Category] Created', { id: category._id, name });
  return category;
};

/**
 * Update an existing category.
 * - Checks for duplicate name if name is being changed
 * - Regenerates slug if name changes
 * - Deletes old image and uploads new one to Cloudinary
 */
const update = async (id, data, imageFile) => {
  assertValidId(id);

  const existing = await categoryRepo.findById(id);
  if (!existing) throw AppError.notFound('Category', 'CATEGORY_NOT_FOUND');

  const updateFields = {};

  if (data.name !== undefined) {
    const trimmedName = data.name.trim();

    // Duplicate name check — exclude current document
    if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
      if (await categoryRepo.existsByName(trimmedName, id)) {
        throw AppError.conflict(
          `A category named "${trimmedName}" already exists.`,
          'CATEGORY_NAME_TAKEN',
        );
      }
      updateFields.slug = await uniqueSlug(trimmedName, (s) => categoryRepo.existsBySlug(s, id));
    }
    updateFields.name = trimmedName;
  }

  if (data.description !== undefined) updateFields.description = data.description;
  if (data.isActive    !== undefined) updateFields.isActive    = data.isActive;

  if (imageFile && imageFile.buffer) {
    // Delete old image file (best-effort)
    if (existing.image) await deleteUploadedFile(existing.image);
    const uploaded = await uploadBufferToCloudinary(imageFile.buffer, { folder: 'categories' });
    updateFields.image = uploaded.url;
  }

  const updated = await categoryRepo.updateById(id, updateFields);
  logger.info('[Category] Updated', { id, fields: Object.keys(updateFields) });
  return updated;
};

/**
 * Delete a category.
 * - Blocks deletion if any active products reference this category
 * - Deletes the associated image file from disk
 */
const remove = async (id) => {
  assertValidId(id);

  const existing = await categoryRepo.findById(id);
  if (!existing) throw AppError.notFound('Category', 'CATEGORY_NOT_FOUND');

  // Block delete if products still reference this category
  const productCount = await productRepo.countByCategory(id);
  if (productCount > 0) {
    throw AppError.conflict(
      `Cannot delete "${existing.name}" — it is referenced by ${productCount} active product(s). ` +
      'Remove or reassign those products first.',
      'CATEGORY_IN_USE',
    );
  }

  // Delete image file (best-effort)
  if (existing.image) await deleteUploadedFile(existing.image);

  await categoryRepo.deleteById(id);
  logger.info('[Category] Deleted', { id, name: existing.name });
};

module.exports = { getAll, getById, create, update, remove };
