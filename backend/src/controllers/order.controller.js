'use strict';

const orderService = require('../services/order.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/response');

// ─── Customer Order Endpoints ─────────────────────────────────────────────────

/**
 * POST /api/orders
 * Create order from cart
 */
const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body);
  return sendCreated(res, { data: { order }, message: 'Order placed successfully' });
});

/**
 * GET /api/orders
 * Get logged-in user's orders
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const { orders, meta } = await orderService.getMyOrders(req.user._id, req.query);
  return sendSuccess(res, { data: { orders }, meta });
});

/**
 * GET /api/orders/:id
 * Get single order details for user
 */
const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getMyOrderById(req.user._id, req.params.id);
  return sendSuccess(res, { data: { order } });
});

// ─── Admin Order Endpoints ───────────────────────────────────────────────────

/**
 * GET /api/admin/orders
 * Admin list all orders
 */
const getAdminOrders = asyncHandler(async (req, res) => {
  const { orders, meta } = await orderService.getAdminOrders(req.query);
  return sendSuccess(res, { data: { orders }, meta });
});

/**
 * GET /api/admin/orders/:id
 * Admin get single order
 */
const getAdminOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getAdminOrderById(req.params.id);
  return sendSuccess(res, { data: { order } });
});

/**
 * PATCH /api/admin/orders/:id/status
 * Admin update order status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, status, note);
  return sendSuccess(res, { data: { order }, message: `Order status updated to ${status}` });
});

/**
 * DELETE /api/admin/orders/:id
 * Admin delete order
 */
const deleteOrder = asyncHandler(async (req, res) => {
  const result = await orderService.deleteOrder(req.params.id);
  return sendSuccess(res, { data: result, message: 'Order deleted successfully' });
});

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  deleteOrder,
};

