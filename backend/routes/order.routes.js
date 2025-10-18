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


// Admin routes - Grouped under /admin/orders
const adminRouter = express.Router();

// Apply authentication and authorization to all admin routes
adminRouter.use(authenticate);
adminRouter.use(authorize); // Ensure only admin can access these routes

// Test admin route
adminRouter.get('/test-admin', (req, res) => {
  console.log('Admin test route hit', { user: req.user });
  res.status(200).json({
    success: true,
    message: 'Admin test route is working!',
    user: req.user || 'No user data'
  });
});

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


// Ship order (admin only)
adminRouter.post(
  '/:orderId/ship',
  orderIdValidation,
  validateRequest,
  (req, res, next) => {
    // Set the status to 'shipped' and pass to updateOrderStatus
    req.body.status = 'shipped';
    next();
  },
  updateOrderStatus
);

// Get order analytics (admin only)
adminRouter.get(
  '/analytics',
  orderAnalyticsValidation,
  validateRequest,
  getOrderAnalytics
);

// Mount admin routes with /api/admin/orders prefix
router.use('/admin/orders', adminRouter);
export default router;
