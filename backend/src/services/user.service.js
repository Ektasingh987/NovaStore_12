'use strict';

const mongoose = require('mongoose');
const userRepo = require('../repositories/user.repository');
const orderRepo = require('../repositories/order.repository');
const tokenService = require('./token.service');
const AppError = require('../utils/AppError');
const { buildPagination, buildPaginationMeta } = require('../utils/queryBuilder');
const { deleteUploadedFile } = require('../utils/fileHelper');
const { uploadBufferToCloudinary } = require('../utils/cloudinaryHelper');
const logger = require('../config/logger');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const assertValidId = (id, label = 'User ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw AppError.notFound(label, 'USER_NOT_FOUND');
  }
};

const USER_SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
};

// ─── Profile Operations (User) ────────────────────────────────────────────────

/**
 * Get profile for authenticated user.
 */
const getProfile = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user || !user.isActive) {
    throw AppError.notFound('User account', 'USER_NOT_FOUND');
  }
  return user.toPublicJSON ? user.toPublicJSON() : user;
};

/**
 * Update profile for authenticated user (name, phone, avatar).
 */
const updateProfile = async (userId, data, avatarFile) => {
  const user = await userRepo.findById(userId);
  if (!user || !user.isActive) {
    throw AppError.notFound('User account', 'USER_NOT_FOUND');
  }

  const updateFields = {};
  if (data.name !== undefined) updateFields.name = data.name.trim();
  if (data.phone !== undefined) updateFields.phone = data.phone.trim();

  if (avatarFile && avatarFile.buffer) {
    if (user.avatar) {
      await deleteUploadedFile(user.avatar);
    }
    const uploaded = await uploadBufferToCloudinary(avatarFile.buffer, {
      folder: 'users',
      transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
    });
    updateFields.avatar = uploaded.url;
  }

  const updated = await userRepo.updateById(userId, updateFields);
  logger.info('[User] Profile updated', { userId, fields: Object.keys(updateFields) });
  return updated.toPublicJSON ? updated.toPublicJSON() : updated;
};

// ─── Admin Operations ─────────────────────────────────────────────────────────

/**
 * List all users with filtering, search, and pagination.
 */
const getAdminUsers = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

  if (query.search && String(query.search).trim()) {
    const searchRegex = new RegExp(String(query.search).trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  const sort = USER_SORT_MAP[query.sort] || USER_SORT_MAP.newest;

  const [users, total] = await Promise.all([
    userRepo.findAll({ filter, sort, skip, limit }),
    userRepo.countAll(filter),
  ]);

  return {
    users,
    meta: buildPaginationMeta({ total, page, limit }),
  };
};

/**
 * Get single user by ID for admin.
 */
const getAdminUserById = async (userId) => {
  assertValidId(userId);
  const user = await userRepo.findLeanById(userId);
  if (!user) {
    throw AppError.notFound('User', 'USER_NOT_FOUND');
  }
  return user;
};

/**
 * Get orders placed by a specific user (Admin).
 */
const getAdminUserOrders = async (userId, query = {}) => {
  assertValidId(userId);
  const user = await userRepo.findLeanById(userId);
  if (!user) {
    throw AppError.notFound('User', 'USER_NOT_FOUND');
  }

  const { page, limit, skip } = buildPagination(query);
  const [orders, total] = await Promise.all([
    orderRepo.findByUserId({ userId, skip, limit }),
    orderRepo.countByUserId(userId),
  ]);

  return {
    user,
    orders,
    meta: buildPaginationMeta({ total, page, limit }),
  };
};

/**
 * Update user active status (Admin).
 * If deactivating (isActive = false), revokes all active refresh tokens immediately!
 */
const updateUserStatus = async (userId, isActive) => {
  assertValidId(userId);

  const user = await userRepo.findById(userId);
  if (!user) {
    throw AppError.notFound('User', 'USER_NOT_FOUND');
  }

  const updated = await userRepo.updateById(userId, { isActive });

  // Security enforcement: Deactivating a user MUST revoke all their refresh token sessions!
  if (!isActive) {
    await tokenService.revokeAllUserTokens(userId);
    logger.warn('[Security] User deactivated — all refresh tokens revoked', { userId });
  } else {
    logger.info('[Admin] User status updated', { userId, isActive });
  }

  return updated.toPublicJSON ? updated.toPublicJSON() : updated;
};

module.exports = {
  getProfile,
  updateProfile,
  getAdminUsers,
  getAdminUserById,
  getAdminUserOrders,
  updateUserStatus,
};
