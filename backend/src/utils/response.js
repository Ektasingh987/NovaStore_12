'use strict';

/**
 * sendSuccess — Standardised success response helper.
 *
 * @param {import('express').Response} res
 * @param {object} options
 * @param {unknown}  options.data        Payload to return
 * @param {string}   [options.message]   Human-readable message
 * @param {number}   [options.statusCode] HTTP status (default 200)
 * @param {object}   [options.meta]      Pagination / extra metadata
 */
const sendSuccess = (res, { data = null, message = 'Success', statusCode = 200, meta = null } = {}) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * sendCreated — Convenience wrapper for 201 Created responses.
 */
const sendCreated = (res, { data = null, message = 'Created successfully' } = {}) =>
  sendSuccess(res, { data, message, statusCode: 201 });

/**
 * sendNoContent — 204 No Content (body is empty per HTTP spec).
 */
const sendNoContent = (res) => res.status(204).end();

/**
 * paginationMeta — Build a standard pagination metadata object.
 *
 * @param {number} total   Total records matching the query
 * @param {number} page    Current page (1-based)
 * @param {number} limit   Items per page
 * @returns {{ total, page, limit, totalPages, hasNext, hasPrev }}
 */
const paginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

module.exports = { sendSuccess, sendCreated, sendNoContent, paginationMeta };
