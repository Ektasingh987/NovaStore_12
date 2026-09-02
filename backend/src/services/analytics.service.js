'use strict';

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * Get dashboard overview statistics using MongoDB aggregations.
 *
 * Computes:
 *   - totalUsers: total registered customers
 *   - totalProducts: total active products
 *   - totalOrders: total orders placed
 *   - totalRevenue: sum of total for all Delivered orders (aggregation)
 *   - recentOrders: last 5 orders with customer name, status, total, createdAt
 *   - ordersByStatus: breakdown of order counts by status (aggregation)
 */
const getStatsOverview = async () => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    revenueAgg,
    statusAgg,
    recentOrdersRaw,
  ] = await Promise.all([
    // 1. Total Customers
    User.countDocuments({ role: 'customer' }),

    // 2. Total Active Products
    Product.countDocuments({ isActive: true }),

    // 3. Total Orders
    Order.countDocuments(),

    // 4. Total Revenue (Delivered orders only) via Aggregation
    Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]),

    // 5. Orders Grouped by Status via Aggregation
    Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // 6. Recent 5 Orders
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name')
      .lean(),
  ]);

  // Extract revenue amount
  const totalRevenue = revenueAgg.length > 0 ? Math.round(revenueAgg[0].totalRevenue * 100) / 100 : 0;

  // Format ordersByStatus with all possible status keys default to 0
  const ordersByStatus = {
    Pending: 0,
    Confirmed: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };
  statusAgg.forEach((item) => {
    if (item._id && ordersByStatus.hasOwnProperty(item._id)) {
      ordersByStatus[item._id] = item.count;
    }
  });

  // Format recent orders
  const recentOrders = recentOrdersRaw.map((order) => ({
    id: order._id,
    orderNumber: order.orderNumber,
    customerName: order.userId?.name || order.address?.fullName || 'Customer',
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
  }));

  return {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    recentOrders,
    ordersByStatus,
  };
};

module.exports = {
  getStatsOverview,
};
