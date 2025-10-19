import express from 'express';
import { param, query, body } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware.js';
import { protectRoute as authenticate, adminRoute as authorize, optionalAuth } from '../middleware/auth.middleware.js';

// Import controllers
import {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
} from '../controllers/order/order.controller.js';

import {
  generateInvoice,
  requestReturn,
  trackOrder,
} from '../controllers/order/order.extra.controller.js';

// New controllers
import {
  getOrderAnalytics,
  getRevenueReports,
  getTopProductsReport
} from '../controllers/order/order.analytics.controller.js';

import {
  bulkUpdateOrderStatus,
  exportOrders
} from '../controllers/order/order.bulk.controller.js';

import {
  checkStockLevels,
  getLowStockAlerts,
  getBackorderedItems,
  updateInventory
} from '../controllers/order/order.inventory.controller.js';

import {
  processRefund,
  listReturnRequests,
  updateReturnStatus,
  splitOrder,
  addOrderNote,
  generateSalesReport,
} from '../controllers/order/order.admin.controller.js';

// Import validations
import {
  createOrderValidation,
  orderIdValidation,
  updateOrderStatusValidation,
  orderQueryValidation,
  orderReturnValidation,
  orderRefundValidation,
  orderTrackingValidation,
  bulkOrderStatusValidation,
  orderExportValidation,
  orderAnalyticsValidation
} from '../validations/order.validations.js';

import Order from '../models/order.model.js';

const router = express.Router();

// Create order route (authentication optional for guest checkout)
router.post(
  '/',
  authenticate, // This makes authentication optional
  createOrderValidation,
  validateRequest,
  createOrder
);

// Inventory routes
router.get(
  '/inventory/check-stock',
  authenticate,
  [
    query('items').isArray().withMessage('Items must be an array'),
    query('items.*.product').isMongoId().withMessage('Invalid product ID'),
    query('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  validateRequest,
  async (req, res) => {
    const stockInfo = await checkStockLevels(req.query.items);
    res.json(stockInfo);
  }
);

// Admin inventory routes
router.get(
  '/admin/inventory/low-stock',
  authenticate,
  authorize,
  [
    query('threshold').optional().isInt({ min: 1 }).withMessage('Threshold must be a positive number')
  ],
  validateRequest,
  async (req, res) => {
    const threshold = req.query.threshold ? parseInt(req.query.threshold) : 10;
    const lowStockItems = await getLowStockAlerts(threshold);
    res.json({ success: true, data: lowStockItems });
  }
);

router.get(
  '/admin/orders/backorders',
  authenticate,
  authorize,
  validateRequest,
  async (req, res) => {
    const backorders = await getBackorderedItems();
    res.json({ success: true, data: backorders });
  }
);

// Analytics routes
router.get(
  '/analytics',
  authenticate,
  authorize,
  orderAnalyticsValidation,
  validateRequest,
  getOrderAnalytics
);

router.get(
  '/analytics/revenue',
  authenticate,
  authorize,
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format')
  ],
  validateRequest,
  getRevenueReports
);

router.get(
  '/analytics/top-products',
  authenticate,
  authorize,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format')
  ],
  validateRequest,
  getTopProductsReport
);

// Bulk order operations (admin only)
router.post(
  '/bulk/status',
  authenticate,
  authorize,
  bulkOrderStatusValidation,
  validateRequest,
  bulkUpdateOrderStatus
);

// Export orders (admin only)
router.get(
  '/export',
  authenticate,
  authorize,
  orderExportValidation,
  validateRequest,
  exportOrders
);

// Webhook for inventory updates (called internally when order status changes)
router.post(
  '/webhook/inventory-update/:orderId',
  [
    param('orderId').isMongoId().withMessage('Invalid order ID'),
    body('previousStatus').isString().withMessage('Previous status is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      
      await updateInventory(order, req.body.previousStatus);
      res.json({ success: true, message: 'Inventory updated successfully' });
    } catch (error) {
      console.error('Error in inventory webhook:', error);
      res.status(500).json({ success: false, message: 'Error updating inventory', error: error.message });
    }
  }
);

// Existing order routes
router.get(
  '/',
  authenticate,
  orderQueryValidation,
  validateRequest,
  getUserOrders
);

router.get(
  '/all',
  authenticate,
  authorize,
  orderQueryValidation,
  validateRequest,
  getAllOrders
);

router.get(
  '/:orderId',
  authenticate,
  orderIdValidation,
  validateRequest,
  getOrderById
);

router.put(
  '/:orderId/status',
  authenticate,
  updateOrderStatusValidation,
  validateRequest,
  updateOrderStatus
);

router.post(
  '/:orderId/cancel',
  authenticate,
  orderIdValidation,
  validateRequest,
  cancelOrder
);

router.get(
  '/:orderId/invoice',
  authenticate,
  orderIdValidation,
  validateRequest,
  generateInvoice
);

router.post(
  '/:orderId/return',
  authenticate,
  orderReturnValidation,
  validateRequest,
  requestReturn
);

router.get(
  '/:orderId/track',
  authenticate,
  orderTrackingValidation,
  validateRequest,
  trackOrder
);

// Admin routes
router.post(
  '/admin/returns',
  authenticate,
  authorize,
  validateRequest,
  listReturnRequests
);

router.put(
  '/admin/returns/:id/status',
  authenticate,
  authorize,
  updateReturnStatus
);

router.post(
  '/admin/orders/:id/refund',
  authenticate,
  authorize,
  orderRefundValidation,
  validateRequest,
  processRefund
);

router.post(
  '/admin/orders/:id/split',
  authenticate,
  authorize,
  orderIdValidation,
  validateRequest,
  splitOrder
);

router.post(
  '/admin/orders/:id/notes',
  authenticate,
  authorize,
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('note').isString().notEmpty().withMessage('Note is required'),
    body('isInternal').optional().isBoolean().withMessage('isInternal must be a boolean')
  ],
  validateRequest,
  addOrderNote
);

router.get(
  '/admin/reports/sales',
  authenticate,
  authorize,
  orderAnalyticsValidation,
  validateRequest,
  generateSalesReport
);


// Add this to your order.routes.js
router.get('/debug/order/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('user guestEmail status items createdAt deliveredAt');
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    const isOwner = (
      (order.user && req.user?._id && order.user.toString() === req.user._id.toString()) ||
      (order.guestEmail && req.user?.email && 
       order.guestEmail.toLowerCase() === req.user.email.toLowerCase())
    );

    res.json({
      success: true,
      order: {
        _id: order._id,
        user: order.user?.toString(),
        guestEmail: order.guestEmail,
        status: order.status,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
        currentUser: (req.user?._id || req.user?.id)?.toString(),
        currentUserEmail: req.user?.email,
        isOwner,
        isDelivered: order.status === 'delivered',
        isWithinReturnWindow: order.deliveredAt ? 
          (new Date() - new Date(order.deliveredAt)) < (30 * 24 * 60 * 60 * 1000) : false
      },
      authInfo: {
        isAuthenticated: !!req.user,
        user: req.user ? {
          id: req.user.id || req.user._id?.toString(),
          email: req.user.email,
          ...(req.user.role && { role: req.user.role }),
          ...(req.user.name && { name: req.user.name })
        } : null,
        hasUserId: !!(req.user?._id || req.user?.id)
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
export default router;