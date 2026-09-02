'use strict';

const AppError = require('../utils/AppError');

/**
 * validation middleware — validates req against a Joi schema.
 *
 * Usage:
 *   router.post('/users', validate(createUserSchema), asyncHandler(userController.create));
 *
 * Validates req.body by default; pass options.source to target 'query' or 'params'.
 *
 * @param {import('joi').ObjectSchema} schema   Joi schema to validate against
 * @param {'body'|'query'|'params'} [source]    Which part of req to validate
 * @returns {import('express').RequestHandler}
 */
const validate = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,   // Return all errors at once
    stripUnknown: true,  // Remove unknown keys silently
    convert: true,       // Coerce types (e.g. '5' → 5)
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    return next(AppError.validation('Validation failed', details));
  }

  // Overwrite req[source] with the sanitised/coerced value
  req[source] = value;
  return next();
};

module.exports = validate;
