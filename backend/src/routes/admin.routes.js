'use strict';

const express = require('express');
const orderController = require('../controllers/order.controller');
const userController = require('../controllers/user.controller');
const adminController = require('../controllers/admin.controller');
const { protect, requireAdmin } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { listOrderQuerySchema, updateStatusSchema } = require('../validators/order.validator');
const { listUserQuerySchema, updateUserStatusSchema } = require('../validators/user.validator');

const router = express.Router();

// All admin endpoints require authentication + admin role
router.use(protect, requireAdmin);

// ─── Admin Dashboard Stats ───────────────────────────────────────────────────

/** GET /api/admin/stats/overview or /api/admin/dashboard/stats */
router.get('/stats/overview', adminController.getStatsOverview);
router.get('/dashboard/stats', adminController.getStatsOverview);

// ─── Admin Order Management ───────────────────────────────────────────────────

/** GET /api/admin/orders — list all orders with filters */
router.get('/orders', validate(listOrderQuerySchema, 'query'), orderController.getAdminOrders);

/** GET /api/admin/orders/:id — get specific order details */
router.get('/orders/:id', orderController.getAdminOrderById);

/** PATCH /api/admin/orders/:id/status — update order status */
router.patch('/orders/:id/status', validate(updateStatusSchema), orderController.updateOrderStatus);

/** DELETE /api/admin/orders/:id — delete order */
router.delete('/orders/:id', orderController.deleteOrder);

// ─── Admin User Management ────────────────────────────────────────────────────

/** GET /api/admin/users — list all users with pagination, search, filter, sort */
router.get('/users', validate(listUserQuerySchema, 'query'), userController.getAdminUsers);

/** GET /api/admin/users/:id — get single user details */
router.get('/users/:id', userController.getAdminUserById);

/** GET /api/admin/users/:id/orders — get orders for specific user */
router.get('/users/:id/orders', userController.getAdminUserOrders);

/** PATCH /api/admin/users/:id/status — activate/deactivate user (revokes refresh tokens) */
router.patch(
  '/users/:id/status',
  validate(updateUserStatusSchema),
  userController.updateUserStatus,
);

/** DELETE /api/admin/users/:id — delete user account */
router.delete('/users/:id', userController.deleteUser);

module.exports = router;

