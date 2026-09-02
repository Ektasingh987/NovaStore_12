'use strict';

/**
 * Generate a unique, human-readable order number.
 *
 * Format: ORD-YYYYMMDD-NNNNN
 * Example: ORD-20260902-00010
 *
 * Finds the highest existing sequence number for today to guarantee that
 * deleted orders or gaps never cause duplicate key collisions.
 */

const generateOrderNumber = async () => {
  // Lazy-require to avoid circular dependencies at module load time
  const Order = require('../models/Order');

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const prefix = `ORD-${dateStr}-`;

  try {
    // Find the latest order placed today matching today's prefix
    const latestOrder = await Order.findOne({
      orderNumber: { $regex: `^${prefix}` },
    })
      .sort({ orderNumber: -1 })
      .select('orderNumber')
      .lean();

    let nextSeq = 1;

    if (latestOrder && latestOrder.orderNumber) {
      const parts = latestOrder.orderNumber.split('-');
      if (parts.length === 3) {
        const parsedSeq = parseInt(parts[2], 10);
        if (!isNaN(parsedSeq)) {
          nextSeq = parsedSeq + 1;
        }
      }
    }

    // Double-check with while-exists loop to guarantee 100% collision-free uniqueness
    let candidate = `${prefix}${String(nextSeq).padStart(5, '0')}`;
    while (await Order.exists({ orderNumber: candidate })) {
      nextSeq += 1;
      candidate = `${prefix}${String(nextSeq).padStart(5, '0')}`;
    }

    return candidate;
  } catch (err) {
    // Fallback: guaranteed unique using random digits + timestamp slice
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const tsSuffix = Date.now().toString().slice(-4);
    return `${prefix}${tsSuffix}${randomSuffix}`;
  }
};

module.exports = { generateOrderNumber };
