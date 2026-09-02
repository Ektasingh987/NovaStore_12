'use strict';

const fs   = require('fs');
const path = require('path');
const logger = require('../config/logger');

/** Absolute path to the uploads root directory. */
const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Resolve any stored URL/path to an absolute filesystem path.
 *
 * Handles three input formats:
 *   1. Absolute FS path:              /C:/…/uploads/products/file.jpg
 *   2. URL with /uploads/ segment:    http://localhost:5000/uploads/products/file.jpg
 *   3. Relative under uploads/:       products/file.jpg
 *
 * @param {string} input
 * @returns {string} Absolute FS path
 */
const resolveToAbsolute = (input) => {
  if (!input) return null;

  // Already absolute filesystem path
  if (path.isAbsolute(input)) return input;

  // URL — extract the path segment after '/uploads/'
  const match = input.match(/\/uploads\/(.+)$/);
  if (match) return path.join(UPLOADS_ROOT, match[1]);

  // Relative (e.g. "products/file.jpg")
  return path.join(UPLOADS_ROOT, input);
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Delete a single uploaded file (from Cloudinary or local disk).
 * Best-effort — logs a warning on failure but never throws.
 *
 * @param {string} filePathOrUrl
 */
const deleteUploadedFile = async (filePathOrUrl) => {
  if (!filePathOrUrl) return;

  // Cloudinary image
  if (filePathOrUrl.includes('cloudinary.com')) {
    const { deleteFromCloudinary } = require('./cloudinaryHelper');
    await deleteFromCloudinary(filePathOrUrl);
    return;
  }

  const absolutePath = resolveToAbsolute(filePathOrUrl);
  if (!absolutePath) return;

  try {
    await fs.promises.unlink(absolutePath);
    logger.debug(`[FileHelper] Deleted: ${absolutePath}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      // ENOENT = file already gone — not an error worth logging
      logger.warn(`[FileHelper] Failed to delete file`, {
        path: absolutePath,
        error: err.message,
      });
    }
  }
};

/**
 * Delete multiple uploaded files concurrently.
 * Silently skips null/undefined entries.
 *
 * @param {string[]} filePathsOrUrls
 */
const deleteUploadedFiles = (filePathsOrUrls = []) =>
  Promise.all(filePathsOrUrls.filter(Boolean).map(deleteUploadedFile));

/**
 * Build the public-facing URL for an uploaded file.
 *
 * @param {'products'|'categories'|'users'} subfolder
 * @param {string} filename   The filename stored on disk (from req.file.filename)
 * @returns {string}          e.g. "http://localhost:5000/uploads/products/123.jpg"
 */
const buildFileUrl = (subfolder, filename) => {
  // Lazy-require env to avoid circular dependency at module load time
  const { PUBLIC_API_URL } = require('../config/env');
  return `${PUBLIC_API_URL}/uploads/${subfolder}/${filename}`;
};

/**
 * Extract just the filename from a full URL or path.
 *
 * @param {string} urlOrPath
 * @returns {string}
 */
const extractFilename = (urlOrPath) => path.basename(urlOrPath || '');

module.exports = {
  deleteUploadedFile,
  deleteUploadedFiles,
  buildFileUrl,
  extractFilename,
  UPLOADS_ROOT,
};
