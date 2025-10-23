import { validationResult } from 'express-validator';

/**
 * Middleware to validate request using express-validator
 * @param {Array} validations - Array of validation chains
 * @returns {Function} Express middleware function
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // If validations is a function, it's a single validation chain
    if (typeof validations === 'function') {
      await validations.run(req);
    } 
    // If validations is an array, run all validations
    else if (Array.isArray(validations)) {
      await Promise.all(validations.map(validation => {
        if (typeof validation === 'function') {
          return validation.run ? validation.run(req) : validation(req, res, () => {});
        }
        return Promise.resolve();
      }));
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        location: err.location
      }))
    });
  };
};

/**
 * Middleware to validate URL parameters
 * @param {Array} validations - Array of validation chains
 * @returns {Function} Express middleware function
 */
export const validateParams = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        param: err.param,
        message: err.msg,
        location: err.location
      }))
    });
  };
};
