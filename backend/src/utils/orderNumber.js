'use strict';

/**
 * Generate a unique, human-readable order number.
 *
 * Format: ORD-YYYYMMDD-NNNNN
 * Example: ORD-20260901-00001
 *
 * Uses the count of orders created today to determine the sequence number.
 * Falls back to a millisecond timestamp on DB error.
 *
 * IMPORTANT: Call this BEFORE starting a MongoDB transaction to avoid
 * running a countDocuments inside a transaction (unnecessary contention).
 */

const generateOrderNumber = async () => {
  // Lazy-require to avoid circular deps at module load time
  const Order = require('../models/Order');

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  try {
    const startOfDay = new Date(yyyy, now.getMonth(), now.getDate(),  0,  0,  0);
    const endOfDay   = new Date(yyyy, now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayCount = await Order.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const seq = String(todayCount + 1).padStart(5, '0');
    return `ORD-${dateStr}-${seq}`;
  } catch {
    // Fallback: timestamp suffix (still unique and human-readable)
    return `ORD-${dateStr}-${Date.now()}`;
  }
};

module.exports = { generateOrderNumber };
