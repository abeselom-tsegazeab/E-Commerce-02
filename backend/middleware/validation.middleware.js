import { validationResult } from 'express-validator';

/**
 * Middleware to validate request using express-validator
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  
  next();
};

/**
 * Middleware to validate MongoDB ObjectId parameters
 * @param {string[]} params - Array of parameter names to validate as ObjectIds
 * @returns {import('express').RequestHandler[]} Array of middleware functions
 */
export const validateObjectIds = (params) => {
  return params.map(param => {
    return (req, res, next) => {
      const value = req.params[param] || req.body[param] || req.query[param];
      
      if (!value || !/^[0-9a-fA-F]{24}$/.test(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${param} format`,
          field: param,
          value: value,
        });
      }
      
      next();
    };
  });
};

/**
 * Middleware to validate required fields in request body
 * @param {string[]} fields - Array of required field names
 * @returns {import('express').RequestHandler} Middleware function
 */
export const requireFields = (fields) => {
  return (req, res, next) => {
    const missingFields = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields,
      });
    }

    next();
  };
};
