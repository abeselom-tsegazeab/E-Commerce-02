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

// Validation for order return request
export const orderReturnValidation = [
  body('reason')
    .notEmpty().withMessage('Return reason is required')
    .isString()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  body('items')
    .isArray({ min: 1 }).withMessage('At least one item must be returned')
    .custom((items) => {
      for (const [index, item] of items.entries()) {
        if (!item.orderItemId) {
          throw new Error(`Order item ID is required for item at index ${index}`);
        }
        if (!item.quantity || item.quantity < 1) {
          throw new Error(`Quantity must be at least 1 for item at index ${index}`);
        }
        if (!['defective', 'wrong_item', 'unwanted', 'other'].includes(item.reason)) {
          throw new Error(`Invalid return reason for item at index ${index}`);
        }
      }
      return true;
    })
];

// Validation for order refund
export const orderRefundValidation = [
  body('amount')
    .isFloat({ min: 0 }).withMessage('Refund amount must be a positive number'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  body('refundMethod')
    .isIn(['original_payment', 'store_credit', 'other'])
    .withMessage('Invalid refund method')
];

// Validation for order tracking
export const orderTrackingValidation = [
  param('trackingNumber')
    .notEmpty().withMessage('Tracking number is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 50 }).withMessage('Tracking number must be between 5 and 50 characters')
];

// Validation for order export
export const orderExportValidation = [
  query('format')
    .optional()
    .isIn(['csv', 'excel', 'json'])
    .withMessage('Invalid export format. Must be one of: csv, excel, json'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format. Use ISO8601 (e.g., YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format. Use ISO8601 (e.g., YYYY-MM-DD)'),
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid status value')
];

// Validation for bulk order status update
export const bulkOrderStatusValidation = [
  body('orderIds')
    .isArray({ min: 1 })
    .withMessage('At least one order ID is required')
    .custom((orderIds) => {
      if (!orderIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
        throw new Error('Invalid order ID format');
      }
      return true;
    }),
  body('status')
    .isIn(['processing', 'shipped', 'delivered', 'cancelled', 'on_hold'])
    .withMessage('Invalid status value'),
  body('notifyCustomer')
    .optional()
    .isBoolean()
    .withMessage('notifyCustomer must be a boolean'),
  body('statusNote')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Status note cannot exceed 1000 characters')
];

export default {
  createOrderValidation,
  orderIdValidation,
  updateOrderStatusValidation,
  orderQueryValidation,
  orderAnalyticsValidation,
  orderReturnValidation,
  orderRefundValidation,
  orderTrackingValidation,
  orderExportValidation
};
