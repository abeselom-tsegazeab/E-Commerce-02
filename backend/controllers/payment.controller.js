import mongoose from 'mongoose';
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import stripe from "../config/stripe.config.js";
import { createPaymentIntent, handleSuccessfulPayment, handleFailedPayment } from '../services/payment.service.js';

/**
 * @route   POST /api/payments/create-payment-intent
 * @desc    Create a payment intent for an order
 * @access  Private
 * @param   {Object}  req.body.orderId  Order ID to create payment for
 * @returns {Object}  Payment intent client secret and order details
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Get the order
    const order = await Order.findById(orderId)
      .populate('user', 'email')
      .populate('items.product', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify the order belongs to the user
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this order'
      });
    }

    // Create payment intent
    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      order,
      order.user.email
    );

    // Update order with payment intent ID
    order.paymentDetails = order.paymentDetails || {};
    order.paymentDetails.paymentIntentId = paymentIntentId;
    await order.save();

    res.status(200).json({
      success: true,
      clientSecret,
      orderId: order._id,
      amount: order.totalAmount,
      currency: 'usd'
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (Stripe needs to access this endpoint)
 */
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody || req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent.id);
      break;
    
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      await handleFailedPayment(failedPaymentIntent.id);
      break;
      
    // Add more event handlers as needed
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
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

export {
  createPaymentIntent,
  handleWebhook,
  getPaymentStatus
};
