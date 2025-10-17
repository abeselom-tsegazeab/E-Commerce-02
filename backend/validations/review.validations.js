import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';

export const validateReviewId = [
  param('reviewId')
    .isMongoId()
    .withMessage('Invalid review ID')
];

export const validateProductId = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid product ID')
    .custom(async (value) => {
      const product = await mongoose.model('Product').findById(value);
      if (!product) {
        throw new Error('Product not found');
      }
      return true;
    })
];

export const createReviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  body('images')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 images allowed'),
  body('images.*')
    .isURL()
    .withMessage('Invalid image URL')
];

export const updateReviewValidation = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  body('images')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 images allowed'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Invalid image URL')
];

export const reviewQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sort')
    .optional()
    .isIn(['-createdAt', 'createdAt', '-rating', 'rating', '-helpfulCount'])
    .withMessage('Invalid sort parameter')
];
