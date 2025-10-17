import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';

export const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('parent')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid parent category ID');
      }
      return true;
    }),
    
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean value'),
    
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
    
  body('metaTitle')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Meta title cannot exceed 100 characters'),
    
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Meta description cannot exceed 255 characters'),
    
  body('metaKeywords')
    .optional()
    .isArray().withMessage('Meta keywords must be an array of strings')
    .custom((keywords) => {
      if (keywords && !keywords.every(k => typeof k === 'string')) {
        throw new Error('All meta keywords must be strings');
      }
      return true;
    })
];

export const updateCategoryValidation = [
  param('id')
    .exists().withMessage('Category ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid category ID');
      }
      return true;
    }),
    
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    
  body('parent')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid parent category ID');
      }
      return true;
    }),
    
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean value'),
    
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
];

export const getCategoriesValidation = [
  query('tree')
    .optional()
    .isBoolean()
    .toBoolean(),
    
  query('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage('Status must be either "active" or "inactive"'),
    
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query cannot exceed 100 characters'),
    
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt()
];

export const reorderCategoriesValidation = [
  body('categories')
    .isArray().withMessage('Categories must be an array')
    .notEmpty().withMessage('Categories array cannot be empty'),
    
  body('categories.*._id')
    .exists().withMessage('Category ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid category ID');
      }
      return true;
    })
];

export const categoryIdValidation = [
  param('id')
    .exists().withMessage('Category ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid category ID');
      }
      return true;
    })
];
