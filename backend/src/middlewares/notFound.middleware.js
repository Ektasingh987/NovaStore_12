'use strict';

const AppError = require('../utils/AppError');

/**
 * notFound middleware — catches requests that reach no route and throws a 404.
 * Must be registered AFTER all routes.
 *
 * @type {import('express').RequestHandler}
 */
const notFoundMiddleware = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
};

module.exports = notFoundMiddleware;
