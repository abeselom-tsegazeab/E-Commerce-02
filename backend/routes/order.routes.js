import express from 'express';
import { param } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware.js';
import { protectRoute as authenticate, adminRoute as authorize, optionalAuth } from '../middleware/auth.middleware.js';
import {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  getOrderAnalytics
} from '../controllers/order/order.controller.js';
import {
  createOrderValidation,
  orderIdValidation,
  updateOrderStatusValidation,
  orderQueryValidation,
  orderAnalyticsValidation
} from '../validations/order.validations.js';

const router = express.Router();

// Create order route (authentication optional for guest checkout)
router.post(
  '/',
  authenticate, // This makes authentication optional
  createOrderValidation,
  validateRequest,
  createOrder
);

// Protected routes (require authentication)

// Get all orders (admin only)
router.get(
  '/',
  authenticate,
  authorize,  // Only admin can list all orders
  orderQueryValidation,
  validateRequest,
  getAllOrders
);

// Get current user's orders
router.get(
  '/my-orders',
  authenticate,
  orderQueryValidation,
  validateRequest,
  getUserOrders
);

router.get(
  '/:orderId',
  authenticate,
  orderIdValidation,
  validateRequest,
  getOrderById
);



router.put(
  '/:orderId/cancel',
  authenticate,
  orderIdValidation,
  validateRequest,
  cancelOrder
);

// Admin routes - Grouped under /admin prefix
const adminRouter = express.Router();

// Get all orders (admin only)
adminRouter.get(
  '/',
  orderQueryValidation,
  validateRequest,
  getAllOrders
);

// Update order status (admin only)
adminRouter.patch(
  '/:orderId/status',
  orderIdValidation,
  updateOrderStatusValidation,
  validateRequest,
  updateOrderStatus
);

// Get order analytics (admin only)
adminRouter.get(
  '/analytics/orders',
  orderAnalyticsValidation,
  validateRequest,
  getOrderAnalytics
);

// Mount admin routes with authentication and authorization
router.use('/admin', authenticate, authorize, adminRouter);

export default router;
