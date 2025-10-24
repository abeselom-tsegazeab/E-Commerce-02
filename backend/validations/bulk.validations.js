import { body } from 'express-validator';
import mongoose from 'mongoose';

// Validation for bulk update operations
export const validateBulkUpdate = ({ productIds, updates }) => {
  const errors = [];

  // Validate productIds
  if (!Array.isArray(productIds) || productIds.length === 0) {
    errors.push('Product IDs must be a non-empty array');
  } else {
    productIds.forEach((id, index) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        errors.push(`Invalid product ID at index ${index}`);
      }
    });
  }

  // Validate updates object
  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    errors.push('Updates object is required and cannot be empty');
  }

  // If there are errors, return them
  if (errors.length > 0) {
    return { error: { details: [{ message: errors.join('; ') }] } };
  }

  // If no errors, return null
  return { error: null };
};

// Validation for bulk status update
export const bulkStatusValidation = [
  (req, res, next) => {
    console.log('Validating bulk status update:', req.body);
    next();
  },
  body('productIds')
    .exists().withMessage('productIds is required')
    .isArray({ min: 1 }).withMessage('At least one product ID is required')
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('productIds must be an array');
      }
      if (value.length === 0) {
        throw new Error('At least one product ID is required');
      }
      const invalidIds = value.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        throw new Error(`Invalid product IDs: ${invalidIds.join(', ')}`);
      }
      return true;
    }),
  body('isActive')
    .exists().withMessage('isActive is required')
    .isBoolean().withMessage('isActive must be a boolean value')
    .toBoolean()
];

// Validation for bulk category update
export const bulkCategoryValidation = [
  body('productIds')
    .isArray({ min: 1 }).withMessage('At least one product ID is required')
    .custom((value) => {
      if (!value.every(id => mongoose.Types.ObjectId.isValid(id))) {
        throw new Error('All product IDs must be valid');
      }
      return true;
    }),
    
  body('category')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid category ID');
      }
      return true;
    }),
    
  body('subcategory')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid subcategory ID');
      }
      return true;
    })
    .custom((value, { req }) => {
      if (value && !req.body.category) {
        throw new Error('Cannot set subcategory without a category');
      }
      return true;
    })
];

// Validation for bulk price update
export const bulkPriceValidation = [
  body('productIds')
    .isArray({ min: 1 }).withMessage('At least one product ID is required')
    .custom((value) => {
      if (!value.every(id => mongoose.Types.ObjectId.isValid(id))) {
        throw new Error('All product IDs must be valid');
      }
      return true;
    }),
    
  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number')
    .custom((value, { req }) => {
      if (req.body.operation === 'set' && value === undefined) {
        throw new Error('Price is required when operation is "set"');
      }
      return true;
    }),
    
  body('operation')
    .optional()
    .isIn(['set', 'increase', 'decrease', 'percentage_increase', 'percentage_decrease'])
    .withMessage('Invalid operation. Must be one of: set, increase, decrease, percentage_increase, percentage_decrease'),
    
  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number')
    .custom((value, { req }) => {
      const operation = req.body.operation || 'set';
      if (['increase', 'decrease', 'percentage_increase', 'percentage_decrease'].includes(operation) && value === undefined) {
        throw new Error('Amount is required for this operation');
      }
      return true;
    })
];

// Validation for bulk delete
export const bulkDeleteValidation = [
  body('productIds')
    .isArray({ min: 1 }).withMessage('At least one product ID is required')
    .custom((value) => {
      if (!value.every(id => mongoose.Types.ObjectId.isValid(id))) {
        throw new Error('All product IDs must be valid');
      }
      return true;
    })
];
