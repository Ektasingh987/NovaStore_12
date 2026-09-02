'use strict';

const analyticsService = require('../services/analytics.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/admin/stats/overview
 * Returns high-level dashboard metrics, revenue, recent orders, and status breakdown.
 */
const getStatsOverview = asyncHandler(async (_req, res) => {
  const stats = await analyticsService.getStatsOverview();
  return sendSuccess(res, { data: stats });
});

module.exports = {
  getStatsOverview,
};
