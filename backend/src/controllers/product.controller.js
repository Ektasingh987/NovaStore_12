'use strict';

const productService = require('../services/product.service');
const asyncHandler   = require('../utils/asyncHandler');
const { sendSuccess, sendCreated, sendNoContent } = require('../utils/response');

// ─── GET /api/products ────────────────────────────────────────────────────────
const getAll = asyncHandler(async (req, res) => {
  const { products, meta } = await productService.getAll(req.query);
  return sendSuccess(res, { data: { products }, meta });
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────
const getOne = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  return sendSuccess(res, { data: { product } });
});

// ─── POST /api/products ───────────────────────────────────────────────────────
const create = asyncHandler(async (req, res) => {
  // req.files is an array from multer.array('images', N)
  const product = await productService.create(req.body, req.files || []);
  return sendCreated(res, { data: { product }, message: 'Product created successfully' });
});

// ─── PATCH /api/products/:id ──────────────────────────────────────────────────
const update = asyncHandler(async (req, res) => {
  const product = await productService.update(req.params.id, req.body, req.files || []);
  return sendSuccess(res, { data: { product }, message: 'Product updated successfully' });
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
const remove = asyncHandler(async (req, res) => {
  await productService.remove(req.params.id);
  return sendNoContent(res);
});

module.exports = { getAll, getOne, create, update, remove };
