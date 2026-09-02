'use strict';

const path = require('path');
const multer = require('multer');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const MAX_FILE_SIZE = env.MAX_FILE_SIZE_MB * 1024 * 1024; // Convert MB → bytes

// ─── Allowed MIME types ───────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

/**
 * File filter — only accepts allowed image MIME types.
 */
const imageFileFilter = (_req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      AppError.badRequest(
        `Invalid file type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP, GIF`,
        'INVALID_FILE_TYPE',
      ),
      false,
    );
  }
};

// ─── Memory Storage Engine ───────────────────────────────────────────────────
// Memory storage retains file as buffer in memory (req.file.buffer / req.files[i].buffer)
// for direct streaming upload to Cloudinary.
const memoryStorage = multer.memoryStorage();

// ─── Upload instances ─────────────────────────────────────────────────────────

/** Upload handler for product images (up to 5 files, field: "images") */
const uploadProductImages = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).array('images', 5);

/** Upload handler for category images (single file, field: "image") */
const uploadCategoryImage = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('image');

/** Upload handler for user avatars (single file, field: "avatar") */
const uploadUserAvatar = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('avatar');

/**
 * Wrap a multer upload handler so Multer errors are forwarded to the
 * Express error middleware as AppErrors instead of crashing or returning
 * a plain text response.
 *
 * @param {Function} uploadFn  Multer middleware (single / array / fields)
 * @returns {import('express').RequestHandler}
 */
const wrapMulter = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        AppError.badRequest(
          `File too large. Maximum allowed size is ${env.MAX_FILE_SIZE_MB}MB.`,
          'FILE_TOO_LARGE',
        ),
      );
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(AppError.badRequest('Too many files uploaded.', 'TOO_MANY_FILES'));
    }
    if (err instanceof AppError) return next(err);

    return next(AppError.badRequest(err.message || 'File upload error', 'UPLOAD_ERROR'));
  });
};

module.exports = {
  uploadProductImages: wrapMulter(uploadProductImages),
  uploadCategoryImage: wrapMulter(uploadCategoryImage),
  uploadUserAvatar: wrapMulter(uploadUserAvatar),
};
