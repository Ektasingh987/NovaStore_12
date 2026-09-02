'use strict';

const express = require('express');
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { uploadUserAvatar } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validation.middleware');
const { updateProfileSchema } = require('../validators/user.validator');

const router = express.Router();

// User endpoints require authentication
router.use(protect);

/** GET /api/users/me — profile */
router.get('/me', userController.getProfile);

/** PATCH /api/users/me — update name, phone, or avatar */
router.patch(
  '/me',
  uploadUserAvatar,
  validate(updateProfileSchema),
  userController.updateProfile,
);

module.exports = router;
