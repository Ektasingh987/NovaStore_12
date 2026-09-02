'use strict';

/**
 * asyncHandler — Wraps an async Express route handler and forwards
 * any rejected promise to Express's next() error handler.
 *
 * Eliminates repetitive try/catch boilerplate in controllers.
 *
 * @param {Function} fn  Async (req, res, next) => Promise<void>
 * @returns {Function}   Express middleware function
 *
 * @example
 *   router.get('/users', asyncHandler(async (req, res) => {
 *     const users = await userService.list();
 *     res.json(users);
 *   }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
