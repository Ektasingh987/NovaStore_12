'use strict';

const categoryService = require('../services/category.service');
const asyncHandler    = require('../utils/asyncHandler');
const { sendSuccess, sendCreated, sendNoContent } = require('../utils/response');

// ─── GET /api/categories ──────────────────────────────────────────────────────
const getAll = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAll();
  return sendSuccess(res, { data: { categories } });
});

// ─── GET /api/categories/:id ──────────────────────────────────────────────────
const getOne = asyncHandler(async (req, res) => {
  const category = await categoryService.getById(req.params.id);
  return sendSuccess(res, { data: { category } });
});

// ─── POST /api/categories ─────────────────────────────────────────────────────
const create = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.body, req.file);
  return sendCreated(res, { data: { category }, message: 'Category created successfully' });
});

// ─── PATCH /api/categories/:id ────────────────────────────────────────────────
const update = asyncHandler(async (req, res) => {
  const category = await categoryService.update(req.params.id, req.body, req.file);
  return sendSuccess(res, { data: { category }, message: 'Category updated successfully' });
});

// ─── DELETE /api/categories/:id ───────────────────────────────────────────────
const remove = asyncHandler(async (req, res) => {
  await categoryService.remove(req.params.id);
  return sendNoContent(res);
});

module.exports = { getAll, getOne, create, update, remove };
