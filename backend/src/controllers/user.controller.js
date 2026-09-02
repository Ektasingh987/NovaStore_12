'use strict';

const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

// ─── Customer Endpoints ───────────────────────────────────────────────────────

/**
 * GET /api/users/me
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  return sendSuccess(res, { data: { user } });
});

/**
 * PATCH /api/users/me
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body, req.file);
  return sendSuccess(res, { data: { user }, message: 'Profile updated successfully' });
});

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 */
const getAdminUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await userService.getAdminUsers(req.query);
  return sendSuccess(res, { data: { users }, meta });
});

/**
 * GET /api/admin/users/:id
 */
const getAdminUserById = asyncHandler(async (req, res) => {
  const user = await userService.getAdminUserById(req.params.id);
  return sendSuccess(res, { data: { user } });
});

/**
 * GET /api/admin/users/:id/orders
 */
const getAdminUserOrders = asyncHandler(async (req, res) => {
  const { user, orders, meta } = await userService.getAdminUserOrders(req.params.id, req.query);
  return sendSuccess(res, { data: { user, orders }, meta });
});

/**
 * PATCH /api/admin/users/:id/status
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await userService.updateUserStatus(req.params.id, isActive);
  const actionText = isActive ? 'activated' : 'deactivated';
  return sendSuccess(res, { data: { user }, message: `User successfully ${actionText}` });
});

/**
 * DELETE /api/admin/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteAdminUser(req.params.id);
  return sendSuccess(res, { data: result, message: 'User deleted successfully' });
});

module.exports = {
  getProfile,
  updateProfile,
  getAdminUsers,
  getAdminUserById,
  getAdminUserOrders,
  updateUserStatus,
  deleteUser,
};

