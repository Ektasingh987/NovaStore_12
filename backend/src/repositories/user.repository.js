'use strict';

const User = require('../models/User');

/**
 * Find a user by email.
 * Selects the password field (needed for login comparison).
 * @param {string} email
 */
const findByEmail = (email) =>
  User.findOne({ email: email.toLowerCase().trim() }).select('+password');

/**
 * Find a user by their MongoDB _id.
 * Does NOT select the password field.
 * @param {string|import('mongoose').Types.ObjectId} id
 */
const findById = (id) => User.findById(id);

/**
 * Find a user by their Google OAuth subject ID.
 * @param {string} googleId
 */
const findByGoogleId = (googleId) => User.findOne({ googleId });

/**
 * Check whether a user with the given email already exists.
 * @param {string} email
 * @returns {Promise<boolean>}
 */
const existsByEmail = async (email) => {
  const count = await User.countDocuments({ email: email.toLowerCase().trim() });
  return count > 0;
};

/**
 * Create a new user document.
 * The User model's pre-save hook will hash the password automatically.
 * @param {object} data
 */
const createUser = (data) => User.create(data);

/**
 * Update a user by id and return the updated document.
 * @param {string|import('mongoose').Types.ObjectId} id
 * @param {object} update  Mongoose update expression
 */
const updateById = (id, update) =>
  User.findByIdAndUpdate(id, update, { new: true, runValidators: true });

/**
 * Find user by ID as lean object.
 * @param {string|import('mongoose').Types.ObjectId} id
 */
const findLeanById = (id) =>
  User.findById(id).select('-password').lean();

/**
 * Find users with filtering, sorting, and pagination (Admin).
 * @param {{ filter: object, sort: object, skip: number, limit: number }} params
 */
const findAll = ({ filter, sort, skip, limit }) =>
  User.find(filter)
    .select('-password')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

/**
 * Count users matching filter.
 * @param {object} filter
 */
const countAll = (filter) => User.countDocuments(filter);

/**
 * Delete user by ID.
 * @param {string|import('mongoose').Types.ObjectId} id
 */
const deleteById = (id) => User.findByIdAndDelete(id);

module.exports = {
  findByEmail,
  findById,
  findLeanById,
  findByGoogleId,
  existsByEmail,
  createUser,
  updateById,
  findAll,
  countAll,
  deleteById,
};

