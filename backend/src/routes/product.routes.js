'use strict';

const express = require('express');
const productController = require('../controllers/product.controller');
const { protect, requireAdmin } = require('../middlewares/auth.middleware');
const { uploadProductImages } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validation.middleware');
const { createSchema, updateSchema, listQuerySchema } = require('../validators/product.validator');

const router = express.Router();

// ─── Public routes ────────────────────────────────────────────────────────────

/**
 * GET /api/products
 * Accepts: page, limit, search, category, minPrice, maxPrice, sort, inStock, isFeatured
 */
router.get('/', validate(listQuerySchema, 'query'), productController.getAll);

/** GET /api/products/:id */
router.get('/:id', productController.getOne);

// ─── Admin-only routes ────────────────────────────────────────────────────────

/**
 * POST /api/products
 * Multipart form — up to 5 images in field "images"
 */
router.post(
  '/',
  protect,
  requireAdmin,
  uploadProductImages,      // Multer populates req.files (array)
  validate(createSchema),   // Joi validates non-file body fields
  productController.create,
);

/**
 * PATCH /api/products/:id
 * Multipart form — optionally upload new images to replace existing ones
 */
router.patch(
  '/:id',
  protect,
  requireAdmin,
  uploadProductImages,
  validate(updateSchema),
  productController.update,
);

/**
 * DELETE /api/products/:id
 * Deletes product document and all associated image files from disk
 */
router.delete('/:id', protect, requireAdmin, productController.remove);

module.exports = router;
