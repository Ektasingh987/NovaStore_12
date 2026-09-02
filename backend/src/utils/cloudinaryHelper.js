'use strict';

const { Readable } = require('stream');
const { cloudinary, isConfigured } = require('../config/cloudinary');
const env = require('../config/env');
const logger = require('../config/logger');
const AppError = require('./AppError');

/**
 * Extract the Cloudinary public_id from a full Cloudinary URL or return the public_id string.
 *
 * Example URL:
 *   "https://res.cloudinary.com/cloud_name/image/upload/v1690000000/ecommerce/products/abc123.jpg"
 * -> "ecommerce/products/abc123"
 *
 * @param {string} urlOrPublicId
 * @returns {string|null}
 */
const extractPublicId = (urlOrPublicId) => {
  if (!urlOrPublicId || typeof urlOrPublicId !== 'string') return null;

  // If it doesn't contain res.cloudinary.com or cloudinary, treat as public_id directly
  if (!urlOrPublicId.includes('cloudinary.com')) {
    // Strip file extension if any
    return urlOrPublicId.replace(/\.[^/.]+$/, '');
  }

  try {
    // Match segment after /upload/(v\d+/)? up to the file extension
    const match = urlOrPublicId.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch (err) {
    logger.warn('[Cloudinary] Failed to parse public_id from URL', { url: urlOrPublicId, err: err.message });
  }

  return null;
};

/**
 * Upload a single file buffer to Cloudinary using a stream.
 *
 * @param {Buffer} buffer
 * @param {Object} options
 * @param {string} [options.folder] Subfolder under base folder (e.g. 'products', 'categories', 'users')
 * @param {string} [options.filename] Optional filename without extension
 * @param {Array}  [options.transformation] Optional Cloudinary transformations
 * @returns {Promise<{ url: string, public_id: string, format: string, bytes: number }>}
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  if (!isConfigured()) {
    throw AppError.internal(
      'Cloudinary is not configured. Please provide CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables.',
      'CLOUDINARY_NOT_CONFIGURED',
    );
  }

  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw AppError.badRequest('Invalid file buffer provided for upload', 'INVALID_BUFFER');
  }

  const baseFolder = env.CLOUDINARY_FOLDER || 'ecommerce';
  const subFolder = options.folder ? `${baseFolder}/${options.folder.replace(/^\/|\/$/g, '')}` : baseFolder;

  const uploadOptions = {
    folder: subFolder,
    resource_type: options.resource_type || 'image',
    ...(options.filename && { public_id: options.filename }),
    ...(options.transformation && { transformation: options.transformation }),
  };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error('[Cloudinary] Upload failed', { error: error.message });
          return reject(
            AppError.badRequest(`Image upload failed: ${error.message}`, 'CLOUDINARY_UPLOAD_ERROR'),
          );
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      },
    );

    // Stream buffer into Cloudinary upload stream
    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * Upload multiple Multer files concurrently to Cloudinary.
 *
 * @param {Express.Multer.File[]} files
 * @param {Object} options Options passed to uploadBufferToCloudinary
 * @returns {Promise<Array<{ url: string, public_id: string }>>}
 */
const uploadMultipleBuffers = async (files = [], options = {}) => {
  if (!Array.isArray(files) || files.length === 0) return [];

  const uploadPromises = files.map((file) => {
    const buffer = file.buffer;
    return uploadBufferToCloudinary(buffer, options);
  });

  return Promise.all(uploadPromises);
};

/**
 * Delete a single image from Cloudinary by URL or public ID.
 * Best effort — logs warning on failure but does not throw.
 *
 * @param {string} urlOrPublicId
 * @param {Object} options
 * @returns {Promise<void>}
 */
const deleteFromCloudinary = async (urlOrPublicId, options = {}) => {
  if (!urlOrPublicId || !isConfigured()) return;

  const publicId = extractPublicId(urlOrPublicId);
  if (!publicId) return;

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: options.resource_type || 'image',
      invalidate: true,
    });
    logger.debug('[Cloudinary] Deleted image', { publicId, result: result.result });
  } catch (err) {
    logger.warn('[Cloudinary] Failed to delete image', {
      publicId,
      error: err.message,
    });
  }
};

/**
 * Delete multiple images from Cloudinary concurrently.
 *
 * @param {string[]} urlsOrPublicIds
 * @param {Object} options
 * @returns {Promise<void>}
 */
const deleteMultipleFromCloudinary = (urlsOrPublicIds = [], options = {}) => {
  if (!Array.isArray(urlsOrPublicIds) || urlsOrPublicIds.length === 0) return Promise.resolve();
  return Promise.all(urlsOrPublicIds.filter(Boolean).map((u) => deleteFromCloudinary(u, options)));
};

module.exports = {
  uploadBufferToCloudinary,
  uploadMultipleBuffers,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  extractPublicId,
  isConfigured,
};
