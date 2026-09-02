'use strict';

const Category = require('../models/Category');

/** List all categories matching a filter. Always uses .lean() for performance. */
const findAll = (filter = {}) =>
  Category.find(filter).sort({ name: 1 }).lean();

/** Find one by MongoDB _id. */
const findById = (id) =>
  Category.findById(id).lean();

/** Find one by URL slug. */
const findBySlug = (slug) =>
  Category.findOne({ slug }).lean();

/** Create a new category document. */
const create = (data) => Category.create(data);

/** Update a category by id; returns the updated document. */
const updateById = (id, update) =>
  Category.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });

/** Hard-delete a category by id. */
const deleteById = (id) => Category.findByIdAndDelete(id);

/**
 * Check if a slug is already taken, optionally excluding one document.
 * Used for uniqueness checks during create and update.
 */
const existsBySlug = async (slug, excludeId = null) => {
  const query = { slug };
  if (excludeId) query._id = { $ne: excludeId };
  return (await Category.countDocuments(query)) > 0;
};

/**
 * Case-insensitive name uniqueness check, optionally excluding one document.
 */
const existsByName = async (name, excludeId = null) => {
  const query = { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } };
  if (excludeId) query._id = { $ne: excludeId };
  return (await Category.countDocuments(query)) > 0;
};

module.exports = {
  findAll,
  findById,
  findBySlug,
  create,
  updateById,
  deleteById,
  existsBySlug,
  existsByName,
};
