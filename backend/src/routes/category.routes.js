'use strict';

const express = require('express');
const categoryController = require('../controllers/category.controller');
const { protect, requireAdmin } = require('../middlewares/auth.middleware');
const { uploadCategoryImage } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validation.middleware');
const { createSchema, updateSchema } = require('../validators/category.validator');

const router = express.Router();

// ─── Public routes ────────────────────────────────────────────────────────────

/** GET /api/categories — list all active categories */
router.get('/', categoryController.getAll);

/** GET /api/categories/:id — single category */
router.get('/:id', categoryController.getOne);

// ─── Admin-only routes ────────────────────────────────────────────────────────

/** POST /api/categories — create (supports multipart image upload) */
router.post(
  '/',
  protect,
  requireAdmin,
  uploadCategoryImage,        // Multer — populates req.file
  validate(createSchema),     // Joi — validates req.body (non-file fields)
  categoryController.create,
);

/** PATCH /api/categories/:id — partial update */
router.patch(
  '/:id',
  protect,
  requireAdmin,
  uploadCategoryImage,
  validate(updateSchema),
  categoryController.update,
);

/** DELETE /api/categories/:id — delete (blocked if products exist) */
router.delete('/:id', protect, requireAdmin, categoryController.remove);

module.exports = router;
