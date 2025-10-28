import mongoose from 'mongoose';
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import stripe from "../config/stripe.config.js";
import { createPaymentIntent as createStripePaymentIntent, handleSuccessfulPayment, handleFailedPayment } from '../services/payment.service.js';
import { validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @route   POST /api/payments/create-payment-intent
 * @desc    Create a payment intent for an order
 * @access  Private
 * @param   {Object}  req.body.orderId  Order ID to create payment for
 * @returns {Object}  Payment intent client secret and order details
 */
/**
 * @route   POST /api/payments/create-payment-intent
 * @desc    Create a payment intent for an order
 * @access  Private
 * @param   {string}  req.body.orderId  Order ID to create payment for
 * @param   {number}  [req.body.amount] Optional custom amount in cents
 * @returns {Object}  Payment intent client secret and order details
 */
const createPaymentIntent = async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed for createPaymentIntent', {
        requestId,
        errors: errors.array(),
        body: req.body
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    
    const { orderId, amount } = req.body;

    // Get the order with transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const order = await Order.findById(orderId)
        .populate('user', 'email')
        .populate('items.product', 'name price')
        .session(session);

      if (!order) {
        logger.warn('Order not found', { requestId, orderId });
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Verify order status is valid for payment
      if (order.status !== 'pending') {
        logger.warn('Invalid order status for payment', {
          requestId,
          orderId,
          currentStatus: order.status
        });
        return res.status(400).json({
          success: false,
          message: `Cannot process payment for order with status: ${order.status}`
        });
      }

      // Verify the order belongs to the user
      if (order.user._id.toString() !== req.user._id.toString()) {
        logger.warn('Unauthorized payment attempt', {
          requestId,
          orderId,
          userId: req.user._id,
          orderUserId: order.user._id
        });
        return res.status(403).json({
          success: false,
          message: 'Not authorized to pay for this order'
        });
      }

      // Calculate amount (use provided amount or order total)
      const paymentAmount = amount || order.totalAmount;
      
      logger.info('Creating payment intent', {
        requestId,
        orderId,
        amount: paymentAmount,
        userId: req.user._id
      });

      // Create payment intent
      const { clientSecret, paymentIntentId } = await createStripePaymentIntent(
        { ...order.toObject(), amount: paymentAmount },
        order.user.email,
        requestId
      );

      // Update order with payment intent ID
      order.paymentDetails = order.paymentDetails || {};
      order.paymentDetails.paymentIntentId = paymentIntentId;
      order.paymentDetails.amount = paymentAmount;
      order.paymentDetails.status = 'processing';
      order.paymentDetails.updatedAt = new Date();
      
      await order.save({ session });
      await session.commitTransaction();
      session.endSession();

      const responseTime = Date.now() - startTime;
      logger.info('Payment intent created successfully', {
        requestId,
        orderId,
        paymentIntentId,
        responseTime
      });

      res.status(200).json({
        success: true,
        clientSecret,
        orderId: order._id,
        amount: paymentAmount,
        currency: 'usd',
        requestId
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    const errorId = uuidv4();
    const errorMessage = error.message || 'Failed to create payment intent';
    
    logger.error('Error in createPaymentIntent', {
      errorId,
      requestId: requestId || 'unknown',
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        type: error.type
      },
      body: req.body,
      userId: req.user?._id
    });
    
    const response = {
      success: false,
      message: errorMessage,
      errorId,
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack 
      })
    };
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      response.message = error.message || 'Your card was declined';
      return res.status(402).json(response);
    }
    
    res.status(500).json(response);
  }
};

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (Stripe needs to access this endpoint)
 */
/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (Stripe needs to access this endpoint)
 */
const handleWebhook = async (req, res) => {
  const webhookId = uuidv4();
  const sig = req.headers['stripe-signature'];
  const webhookBody = req.rawBody || req.body;
  
  logger.info('Webhook received', {
    webhookId,
    type: req.headers['stripe-event-type'],
    signature: sig ? 'present' : 'missing'
  });

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      webhookBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed', {
      webhookId,
      error: err.message,
      headers: req.headers,
      body: webhookBody.toString('utf8').substring(0, 500) // Log first 500 chars
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    logger.info(`Processing webhook event: ${event.type}`, {
      webhookId,
      eventId: event.id,
      type: event.type
    });

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        logger.info('Processing payment_intent.succeeded', {
          webhookId,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          customer: paymentIntent.customer
        });
        
        await handleSuccessfulPayment(paymentIntent.id, {
          webhookId,
          eventId: event.id
        });
        break;
    
      case 'payment_intent.payment_failed':
        const paymentFailed = event.data.object;
        logger.warn('Payment failed', {
          webhookId,
          paymentIntentId: paymentFailed.id,
          lastPaymentError: paymentFailed.last_payment_error,
          amount: paymentFailed.amount
        });
        
        await handleFailedPayment(paymentFailed.id, {
          webhookId,
          eventId: event.id,
          error: paymentFailed.last_payment_error
        });
        break;
      
      case 'charge.refunded':
        const charge = event.data.object;
        logger.info('Charge refunded', {
          webhookId,
          chargeId: charge.id,
          amount: charge.amount_refunded,
          paymentIntent: charge.payment_intent
        });
        // Handle refund logic here
        break;
        
      default:
        logger.info(`Unhandled event type: ${event.type}`, {
          webhookId,
          eventType: event.type,
          eventId: event.id
        });
    }

    // Log successful processing
    logger.info('Webhook processed successfully', {
      webhookId,
      eventType: event.type,
      processingTime: `${Date.now() - startTime}ms`
    });

    // Return a response to acknowledge receipt of the event
    res.json({ 
      received: true,
      webhookId,
      eventType: event.type
    });
    
  } catch (error) {
    logger.error('Error processing webhook', {
      webhookId,
      eventType: event?.type,
      error: {
        message: error.message,
        stack: error.stack,
        ...(error.code && { code: error.code })
      }
    });
    
    // Even if we error, we still want to return 200 to prevent Stripe from retrying
    res.status(200).json({
      received: true,
      error: 'Error processing webhook',
      webhookId
    });
  }
};

/**
 * @route   GET /api/payments/order/:orderId/status
 * @desc    Get payment status for an order
 * @access  Private
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Verify the order belongs to the user or is admin
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }
    
    // If we have a payment intent ID, get the latest status from Stripe
    let paymentIntent;
    if (order.paymentDetails?.paymentIntentId) {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(
          order.paymentDetails.paymentIntentId
        );
      } catch (error) {
        console.error('Error fetching payment intent:', error);
        // Continue with the order's payment status if we can't fetch from Stripe
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        amount: order.totalAmount,
        currency: 'usd',
        paymentIntent: paymentIntent ? {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          created: new Date(paymentIntent.created * 1000).toISOString(),
          paymentMethod: paymentIntent.payment_method_types?.[0],
          receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url
        } : null
      }
    });
    
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   POST /api/payment/checkout-success
 * @desc    Handle successful payment and create order
 * @access  Private
 */
const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Here you would typically:
    // 1. Retrieve the session from Stripe
    // 2. Update your order status in the database
    // 3. Send confirmation email, etc.
    
    res.status(200).json({
      success: true,
      message: 'Payment successful',
      sessionId
    });
    
  } catch (error) {
    console.error('Error in checkout success:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing successful payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   POST /api/payment/create-checkout-session
 * @desc    Create a new checkout session
 * @access  Private
 */
const createCheckoutSession = async (req, res) => {
  try {
    const { items, successUrl, cancelUrl } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      });
    }

    // Here you would typically:
    // 1. Create a checkout session with Stripe
    // 2. Return the session ID to the client
    
    const session = {
      id: 'cs_test_' + Math.random().toString(36).substring(2, 15),
      url: 'https://checkout.stripe.com/pay/' + Math.random().toString(36).substring(2, 15)
    };
    
    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating checkout session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export {
  createPaymentIntent,
  handleWebhook,
  getPaymentStatus,
  checkoutSuccess,
  createCheckoutSession
};
