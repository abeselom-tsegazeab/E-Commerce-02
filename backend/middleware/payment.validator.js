import { body, param } from 'express-validator';
import { isValidObjectId } from 'mongoose';

export const validateCreatePaymentIntent = [
  body('orderId')
    .notEmpty().withMessage('Order ID is required')
    .custom(value => isValidObjectId(value)).withMessage('Invalid Order ID format'),
  body('amount')
    .optional()
    .isInt({ min: 50 }).withMessage('Amount must be at least 50 cents')
];

export const validateCheckoutSession = [
  body('items')
    .isArray({ min: 1 }).withMessage('At least one item is required')
    .custom(items => items.every(item => 
      item.price && item.quantity && item.name
    )).withMessage('Each item must have price, quantity, and name'),
  body('successUrl').isURL().withMessage('Valid success URL is required'),
  body('cancelUrl').isURL().withMessage('Valid cancel URL is required')
];

export const validatePaymentStatus = [
  param('orderId')
    .notEmpty().withMessage('Order ID is required')
    .custom(value => isValidObjectId(value)).withMessage('Invalid Order ID format')
];
