import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { paymentLimiter } from '../middleware/rate-limit.js';
import { idempotencyMiddleware } from '../services/idempotency.service.js';
import subscriptionController from '../controllers/subscription.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protectRoute);

/**
 * @route   POST /api/subscriptions
 * @desc    Create a new subscription
 * @access  Private
 * @body    {string} priceId - Stripe price ID for the subscription
 * @body    {string} [paymentMethodId] - Optional payment method ID
 * @returns {Object} Subscription details and client secret for payment confirmation
 */
router.post(
  '/',
  paymentLimiter,
  idempotencyMiddleware({ operation: 'create_subscription' }),
  subscriptionController.createSubscription
);

/**
 * @route   GET /api/subscriptions/:subscriptionId
 * @desc    Get subscription details
 * @access  Private
 * @param   {string} subscriptionId - Stripe subscription ID
 * @returns {Object} Subscription details
 */
router.get(
  '/:subscriptionId',
  subscriptionController.getSubscription
);

/**
 * @route   POST /api/subscriptions/:subscriptionId/cancel
 * @desc    Cancel a subscription
 * @access  Private
 * @param   {string} subscriptionId - Stripe subscription ID
 * @body    {boolean} [cancelAtPeriodEnd=true] - Whether to cancel at period end
 * @returns {Object} Updated subscription details
 */
router.post(
  '/:subscriptionId/cancel',
  subscriptionController.cancelSubscription
);

/**
 * @route   GET /api/subscriptions/user/me
 * @desc    Get current user's subscriptions
 * @access  Private
 * @returns {Object} List of user's subscriptions
 */
router.get(
  '/user/me',
  subscriptionController.getUserSubscriptions
);

export default router;
