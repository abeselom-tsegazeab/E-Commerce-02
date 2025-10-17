import { body, param } from 'express-validator';

// Validation for adding item to wishlist
export const addToWishlistValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID format'),
    
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes cannot be longer than 500 characters'),
    
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
    
  body('customFields')
    .optional()
    .isObject()
    .withMessage('Custom fields must be an object')
];

// Validation for updating wishlist item
export const updateWishlistItemValidation = [
  param('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID format'),
    
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes cannot be longer than 500 characters'),
    
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
    
  body('customFields')
    .optional()
    .isObject()
    .withMessage('Custom fields must be an object')
];

// Validation for moving item to cart
export const moveToCartValidation = [
  param('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID format'),
    
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
];

// Validation for updating wishlist settings
export const updateWishlistSettingsValidation = [
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value'),
    
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .isLength({ max: 100 })
    .withMessage('Name cannot be longer than 100 characters'),
    
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 500 })
    .withMessage('Description cannot be longer than 500 characters')
];

// Validation for shared wishlist
export const sharedWishlistValidation = [
  param('wishlistId')
    .notEmpty()
    .withMessage('Wishlist ID is required')
    .isMongoId()
    .withMessage('Invalid wishlist ID format')
];
