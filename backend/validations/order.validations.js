import { body, param, query } from 'express-validator';

// Validation for order items
const orderItemValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one order item is required'),
  body('items.*.product')
    .trim()
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID format'),
  body('items.*.variant')
    .optional({ checkFalsy: true })
    .trim()
    .if((value) => value && value !== '')
    .isMongoId().withMessage('Invalid variant ID format'),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    .toInt(),
  body('items').custom((items) => {
    for (const [index, item] of items.entries()) {
      if (!item.product) {
        throw new Error(`Product ID is required for item at index ${index}`);
      }
    }
    return true;
  })
];

// Validation for creating an order
export const createOrderValidation = [
  ...orderItemValidation,
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('shippingAddress.street').notEmpty().withMessage('Street is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.postalCode').notEmpty().withMessage('Postal code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
  body('customerNotes').optional().isString(),
  body('isGuest').optional().isBoolean(),
  body('guestEmail')
    .if(body('isGuest').equals(true))
    .notEmpty().withMessage('Guest email is required for guest checkout')
    .isEmail().withMessage('Invalid email format')
];

// Validation for order ID in params
export const orderIdValidation = [
  param('orderId')
    .isMongoId().withMessage('Invalid order ID format')
];

// Validation for order status update
export const updateOrderStatusValidation = [
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid status value'),
  body('trackingNumber').optional().isString(),
  body('shippingCarrier').optional().isIn(['ups', 'fedex', 'usps', 'dhl', 'other'])
];

// Validation for order query parameters
export const orderQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status value'),
  query('userId')
    .optional()
    .isMongoId().withMessage('Invalid user ID format'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format. Use ISO8601 (e.g., YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format. Use ISO8601 (e.g., YYYY-MM-DD)')
];

// Validation for order analytics
export const orderAnalyticsValidation = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format. Use ISO8601 (e.g., YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format. Use ISO8601 (e.g., YYYY-MM-DD)'),
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Invalid groupBy value. Must be one of: day, week, month, year')
];

export default {
  createOrderValidation,
  orderIdValidation,
  updateOrderStatusValidation,
  orderQueryValidation,
  orderAnalyticsValidation
};
