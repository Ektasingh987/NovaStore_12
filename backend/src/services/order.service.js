'use strict';

const mongoose = require('mongoose');
const orderRepo = require('../repositories/order.repository');
const cartRepo = require('../repositories/cart.repository');
const productRepo = require('../repositories/product.repository');
const AppError = require('../utils/AppError');
const { generateOrderNumber } = require('../utils/orderNumber');
const { buildPagination, buildPaginationMeta, buildOrderQuery } = require('../utils/queryBuilder');
const logger = require('../config/logger');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const assertValidId = (id, label = 'Order ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw AppError.notFound(label, 'ORDER_NOT_FOUND');
  }
};

/**
 * Execute work inside a MongoDB transaction if replica set / sessions are supported.
 * Falls back cleanly to non-transactional execution with manual compensation if in standalone dev mode.
 */
const runInTransactionOrFallback = async (fn) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch {
        // Ignored
      }
    }
    // Check if error is due to standalone MongoDB not supporting transactions
    if (
      err.message &&
      (err.message.includes('Transaction numbers are only allowed on a replica set member') ||
        err.message.includes('Transactions are not supported'))
    ) {
      logger.warn('[OrderService] Standalone MongoDB detected — executing without transaction');
      return fn(null);
    }
    throw err;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * POST /api/orders
 * Create order from user's active cart.
 */
const createOrder = async (userId, { address, paymentMethod, notes }) => {
  // 1. Load cart
  const cart = await cartRepo.findByUserId(userId);
  if (!cart || !cart.items || cart.items.length === 0) {
    throw AppError.badRequest('Your cart is empty. Add items before placing an order.', 'CART_EMPTY');
  }

  // 2. Validate all products and stock upfront
  const validatedItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const productId = item.productId?._id || item.productId;
    const product = await productRepo.findById(productId);

    if (!product || !product.isActive) {
      throw AppError.badRequest(
        `Product "${product?.name || productId}" is no longer available.`,
        'PRODUCT_UNAVAILABLE',
      );
    }

    if (product.stock < item.quantity) {
      throw AppError.conflict(
        `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}.`,
        'INSUFFICIENT_STOCK',
      );
    }

    const price = product.price;
    const discount = product.discount || 0;
    const effectivePrice = discount > 0 ? price * (1 - discount / 100) : price;
    const itemTotal = effectivePrice * item.quantity;
    subtotal += itemTotal;

    const primaryImg = (product.images && product.images.length > 0)
      ? (product.images.find((img) => img.isPrimary)?.url || product.images[0].url)
      : null;

    validatedItems.push({
      productId: product._id,
      name: product.name,
      image: primaryImg,
      price: product.price,
      discount,
      quantity: item.quantity,
    });
  }

  // Calculate delivery and total
  const deliveryCharge = subtotal >= 1000 ? 0 : 50; // Free delivery over ₹1000
  const total = Math.round((subtotal + deliveryCharge) * 100) / 100;
  const orderNumber = await generateOrderNumber();

  // 3. Process stock decrement, order creation, and cart clear
  const order = await runInTransactionOrFallback(async (session) => {
    const decremented = [];

    try {
      // Decrement stock for each item atomically
      for (const item of validatedItems) {
        const updated = await productRepo.decrementStock(item.productId, item.quantity, session);
        if (!updated) {
          throw AppError.conflict(
            `Stock changed while processing order for product: ${item.name}.`,
            'STOCK_CONFLICT',
          );
        }
        decremented.push({ productId: item.productId, quantity: item.quantity });
      }

      // Create order
      const newOrder = await orderRepo.create(
        {
          userId,
          orderNumber,
          items: validatedItems,
          subtotal: Math.round(subtotal * 100) / 100,
          discount: 0,
          deliveryCharge,
          total,
          address,
          paymentMethod,
          paymentStatus: paymentMethod === 'COD' ? 'Unpaid' : 'Unpaid',
          status: 'Pending',
          notes: notes || '',
        },
        session,
      );

      // Clear cart
      await cartRepo.clearCart(userId, session);

      return newOrder;
    } catch (err) {
      // If we are in non-transactional fallback, manually revert any decremented stock
      if (!session && decremented.length > 0) {
        for (const dec of decremented) {
          await productRepo.incrementStock(dec.productId, dec.quantity).catch(() => {});
        }
      }
      throw err;
    }
  });

  logger.info('[Order] Order created successfully', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    userId,
    total,
  });

  return order;
};

/**
 * GET /api/orders
 * Customer gets own paginated orders.
 */
const getMyOrders = async (userId, query = {}) => {
  const { page, limit, skip } = buildPagination(query);

  const [orders, total] = await Promise.all([
    orderRepo.findByUserId({ userId, skip, limit }),
    orderRepo.countByUserId(userId),
  ]);

  return {
    orders,
    meta: buildPaginationMeta({ total, page, limit }),
  };
};

/**
 * GET /api/orders/:id
 * Customer gets single order details.
 */
const getMyOrderById = async (userId, orderId) => {
  assertValidId(orderId);

  const order = await orderRepo.findById(orderId);
  if (!order) {
    throw AppError.notFound('Order', 'ORDER_NOT_FOUND');
  }

  // Security check: only the owner or an admin can access
  if (order.userId?._id?.toString() !== userId.toString() && order.userId?.toString() !== userId.toString()) {
    throw AppError.forbidden('You are not authorized to view this order.', 'ACCESS_DENIED');
  }

  return order;
};

/**
 * GET /api/admin/orders
 * Admin gets all orders with filtering and search.
 */
const getAdminOrders = async (query = {}) => {
  const { filter, sort, page, limit, skip } = buildOrderQuery(query);

  // Search by orderNumber if text search is provided
  if (query.search && String(query.search).trim()) {
    const searchRegex = new RegExp(String(query.search).trim(), 'i');
    filter.$or = [{ orderNumber: searchRegex }, { 'address.fullName': searchRegex }, { 'address.phone': searchRegex }];
  }

  const [orders, total] = await Promise.all([
    orderRepo.findAll({ filter, sort, skip, limit }),
    orderRepo.countAll(filter),
  ]);

  return {
    orders,
    meta: buildPaginationMeta({ total, page, limit }),
  };
};

/**
 * GET /api/admin/orders/:id
 * Admin gets order details.
 */
const getAdminOrderById = async (orderId) => {
  assertValidId(orderId);
  const order = await orderRepo.findById(orderId);
  if (!order) {
    throw AppError.notFound('Order', 'ORDER_NOT_FOUND');
  }
  return order;
};

/**
 * PATCH /api/admin/orders/:id/status
 * Admin updates order status.
 */
const updateOrderStatus = async (orderId, status, note = '') => {
  assertValidId(orderId);

  const existingOrder = await orderRepo.findDocById(orderId);
  if (!existingOrder) {
    throw AppError.notFound('Order', 'ORDER_NOT_FOUND');
  }

  const oldStatus = existingOrder.status;
  if (oldStatus === status) {
    return orderRepo.findById(orderId);
  }

  // If transitioning to Cancelled, restore stock
  if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
    for (const item of existingOrder.items) {
      await productRepo.incrementStock(item.productId, item.quantity);
    }
  }

  const updated = await orderRepo.updateStatus(orderId, status, note);
  logger.info('[Order] Status updated', { orderId, from: oldStatus, to: status });
  return updated;
};

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
};
