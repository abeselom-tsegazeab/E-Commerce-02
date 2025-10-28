import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validate-request.js';
import { createSubscription, cancelSubscription, getSubscription } from '../services/subscription.service.js';
import { withIdempotency } from '../services/idempotency.service.js';
import logger from '../utils/logger.js';

/**
 * @route   POST /api/subscriptions
 * @desc    Create a new subscription
 * @access  Private
 */
export const createSubscriptionHandler = [
  // Validation
  body('priceId').isString().notEmpty(),
  body('paymentMethodId').optional().isString(),
  validateRequest,
  
  // Request handler
  async (req, res) => {
    try {
      const { priceId, paymentMethodId } = req.body;
      const { _id: userId } = req.user;
      
      // Get or create customer in Stripe
      let customer;
      if (req.user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(req.user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.name,
          metadata: { userId: userId.toString() },
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
        
        // Update user with Stripe customer ID
        req.user.stripeCustomerId = customer.id;
        await req.user.save();
      }
      
      // Create subscription
      const subscription = await createSubscription({
        customerId: customer.id,
        priceId,
        userId,
        metadata: {
          createdBy: userId.toString(),
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });
      
      res.status(201).json({
        success: true,
        ...subscription
      });
      
    } catch (error) {
      logger.error('Subscription creation failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?._id,
        priceId: req.body?.priceId
      });
      
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code || 'SUBSCRIPTION_ERROR'
      });
    }
  }
];

/**
 * @route   GET /api/subscriptions/:subscriptionId
 * @desc    Get subscription details
 * @access  Private
 */
export const getSubscriptionHandler = [
  // Validation
  param('subscriptionId').isString().notEmpty(),
  validateRequest,
  
  // Request handler
  async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const { _id: userId } = req.user;
      
      const subscription = await getSubscription(subscriptionId, userId);
      
      res.status(200).json(subscription);
      
    } catch (error) {
      logger.error('Failed to get subscription', {
        error: error.message,
        stack: error.stack,
        subscriptionId: req.params?.subscriptionId,
        userId: req.user?._id
      });
      
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code || 'SUBSCRIPTION_NOT_FOUND'
      });
    }
  }
];

/**
 * @route   POST /api/subscriptions/:subscriptionId/cancel
 * @desc    Cancel a subscription
 * @access  Private
 */
export const cancelSubscriptionHandler = [
  // Validation
  param('subscriptionId').isString().notEmpty(),
  body('cancelAtPeriodEnd').optional().isBoolean(),
  validateRequest,
  
  // Request handler
  async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const { cancelAtPeriodEnd = true } = req.body;
      const { _id: userId } = req.user;
      
      const result = await cancelSubscription(subscriptionId, userId, cancelAtPeriodEnd);
      
      res.status(200).json({
        success: true,
        ...result
      });
      
    } catch (error) {
      logger.error('Failed to cancel subscription', {
        error: error.message,
        stack: error.stack,
        subscriptionId: req.params?.subscriptionId,
        userId: req.user?._id
      });
      
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code || 'SUBSCRIPTION_CANCEL_FAILED'
      });
    }
  }
];

/**
 * @route   GET /api/subscriptions/user/me
 * @desc    Get current user's subscriptions
 * @access  Private
 */
export const getUserSubscriptionsHandler = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions
    });
    
  } catch (error) {
    logger.error('Failed to get user subscriptions', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id
    });
    
    res.status(400).json({
      success: false,
      error: error.message,
      code: 'SUBSCRIPTIONS_FETCH_FAILED'
    });
  }
};

export default {
  createSubscription: createSubscriptionHandler,
  getSubscription: getSubscriptionHandler,
  cancelSubscription: cancelSubscriptionHandler,
  getUserSubscriptions: getUserSubscriptionsHandler
};
