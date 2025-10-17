import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';

// Common validation middleware for product operations
export const validateProductData = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Product description must be at least 10 characters'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('compareAtPrice')
    .optional()
    .isFloat({ min: 0 })
    .custom((value, { req }) => {
      if (value && parseFloat(value) <= parseFloat(req.body.price)) {
        throw new Error('Compare at price must be greater than the price');
      }
      return true;
    }),
  
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('category')
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid category ID'),
  
  body('brand')
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid brand ID'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of strings'),
  
  body('variants')
    .optional()
    .isArray()
    .withMessage('Variants must be an array'),
  
  body('variants.*.name')
    .if(body('variants').exists())
    .notEmpty()
    .withMessage('Variant name is required'),
  
  body('variants.*.sku')
    .if(body('variants').exists())
    .notEmpty()
    .withMessage('Variant SKU is required'),
  
  body('variants.*.price')
    .if(body('variants').exists())
    .isFloat({ min: 0 })
    .withMessage('Variant price must be a positive number'),
  
  body('variants.*.quantity')
    .if(body('variants').exists())
    .isInt({ min: 0 })
    .withMessage('Variant quantity must be a non-negative integer'),
];

// Validation for product ID in params
export const validateProductId = [
  param('id')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid product ID')
];

// Validation for product search
export const validateProductSearch = [
  query('q')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Search query cannot be empty'),
  
  query('category')
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid category ID'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number')
    .custom((value, { req }) => {
      if (req.query.minPrice && parseFloat(value) < parseFloat(req.query.minPrice)) {
        throw new Error('Maximum price must be greater than minimum price');
      }
      return true;
    }),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Validation for product variants
export const validateVariantData = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Variant name is required'),
  
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('Variant SKU is required'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer')
];

// Validation for bulk operations
export const validateBulkOperation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('Product IDs are required'),
  
  body('ids.*')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid product ID in the list'),
  
  body('updateData')
    .isObject()
    .withMessage('Update data must be an object')
    .notEmpty()
    .withMessage('Update data cannot be empty')
];

// Validation for inventory updates
export const validateInventoryUpdate = [
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('operation')
    .optional()
    .isIn(['increment', 'decrement', 'set'])
    .withMessage('Operation must be one of: increment, decrement, set'),
  
  body('variantId')
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid variant ID')
];