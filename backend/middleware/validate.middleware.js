import { validationResult } from 'express-validator';

/**
 * Middleware to validate request using express-validator
 * @param {Array} validations - Array of validation chains
 * @returns {Function} Express middleware function
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    console.log('2.1 Entering validation middleware');
    try {
      // If validations is a function, it's a single validation chain
      if (typeof validations === 'function') {
        console.log('2.2 Running single validation');
        await validations.run(req);
      } 
      // If validations is an array, run all validations
      else if (Array.isArray(validations)) {
        console.log(`2.2 Running ${validations.length} validations`);
        await Promise.all(validations.map((validation, index) => {
          console.log(`2.3 Running validation ${index + 1}`);
          if (typeof validation === 'function') {
            const result = validation.run ? validation.run(req) : validation(req, res, () => {});
            console.log(`2.4 Validation ${index + 1} completed`);
            return result;
          }
          console.log(`2.5 Validation ${index + 1} is not a function, skipping`);
          return Promise.resolve();
        }));
      }

      console.log('2.6 All validations completed, checking results');
      const errors = validationResult(req);
      console.log('2.7 Validation errors:', errors.array());
      
      if (errors.isEmpty()) {
        console.log('2.8 No validation errors, proceeding to next middleware');
        return next();
      }

      console.log('2.9 Validation errors found, returning 400');
      const errorResponse = {
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          location: err.location
        }))
      };
      console.log('2.10 Sending error response:', errorResponse);
      return res.status(400).json(errorResponse);
    } catch (error) {
      console.error('2.11 Validation error caught:', error);
      const errorResponse = {
        success: false,
        message: 'Error during validation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
      console.error('2.12 Sending error response:', errorResponse);
      return res.status(500).json(errorResponse);
    }
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
