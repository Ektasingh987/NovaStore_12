'use strict';

const Order = require('../models/Order');

/**
 * Create a new order document.
 * Supports session for MongoDB transactions.
 * @param {object} data
 * @param {import('mongoose').ClientSession|null} session
 */
const create = async (data, session = null) => {
  const options = session ? { session } : {};
  const [order] = await Order.create([data], options);
  return order;
};

/**
 * Find order by ID.
 * Returns lean document.
 * @param {string|import('mongoose').Types.ObjectId} id
 */
const findById = (id) =>
  Order.findById(id)
    .populate('userId', 'name email phone')
    .lean();

/**
 * Find order by ID as a Mongoose document (for updates/save).
 * @param {string|import('mongoose').Types.ObjectId} id
 */
const findDocById = (id) => Order.findById(id);

/**
 * Find customer's orders (paginated, lean).
 * @param {{ userId: string, skip: number, limit: number }} params
 */
const findByUserId = ({ userId, skip, limit }) =>
  Order.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

/**
 * Count customer's orders.
 * @param {string} userId
 */
const countByUserId = (userId) => Order.countDocuments({ userId });

/**
 * Find all orders for admin with filtering, search, pagination.
 * @param {{ filter: object, sort: object, skip: number, limit: number }} params
 */
const findAll = ({ filter, sort, skip, limit }) =>
  Order.find(filter)
    .populate('userId', 'name email phone')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

/**
 * Count total orders matching filter for admin.
 * @param {object} filter
 */
const countAll = (filter) => Order.countDocuments(filter);

/**
 * Update order status.
 * @param {string|import('mongoose').Types.ObjectId} id
 * @param {string} status
 * @param {string} [note]
 */
const updateStatus = async (id, status, note = '') => {
  const order = await Order.findById(id);
  if (!order) return null;

  order.status = status;
  if (note) {
    order.statusHistory.push({ status, changedAt: new Date(), note });
  }
  await order.save();
  return Order.findById(id).populate('userId', 'name email phone').lean();
};

module.exports = {
  create,
  findById,
  findDocById,
  findByUserId,
  countByUserId,
  findAll,
  countAll,
  updateStatus,
};
