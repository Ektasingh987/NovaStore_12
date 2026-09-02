'use strict';

const cloudinary = require('cloudinary').v2;
const env = require('./env');
const logger = require('./logger');

const configureCloudinary = () => {
  const isConfigured = Boolean(
    env.CLOUDINARY_URL ||
    (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET),
  );

  if (isConfigured) {
    if (env.CLOUDINARY_URL) {
      cloudinary.config({
        cloudinary_url: env.CLOUDINARY_URL,
        secure: true,
      });
    } else {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key:    env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        secure:     true,
      });
    }
  }

  return isConfigured;
};

// Initial config
if (configureCloudinary()) {
  logger.info('[Cloudinary] Configured successfully');
} else {
  logger.warn(
    '[Cloudinary] Missing configuration credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). ' +
    'Please set these environment variables in .env',
  );
}

module.exports = {
  cloudinary,
  isConfigured: () => configureCloudinary(),
};
