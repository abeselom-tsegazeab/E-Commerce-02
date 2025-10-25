import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { 
  createPaymentIntent,
  handleWebhook,
  getPaymentStatus,
  checkoutSuccess, 
  createCheckoutSession 
} from '../controllers/payment.controller.js';
import bodyParser from 'body-parser';

/**
 * Payment Routes
 * 
 * This module provides API endpoints for processing payments and handling
 * payment-related operations using Stripe.
 * All routes are protected and require authentication.
 */

const router = express.Router();

/**
 * @route   POST /api/payments/create-payment-intent
 * @desc    Create a payment intent for an order
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @body    {string}  orderId        ID of the order to pay for
 * 
 * @response {Object} 200 - Payment intent created successfully
 * @response {Object} 400 - Invalid request data
 * @response {Object} 401 - Unauthorized
 * @response {Object} 403 - Forbidden (order doesn't belong to user)
 * @response {Object} 404 - Order not found
 * 
 * @example
 * // Request body
 * {
 *   "orderId": "60d21b4667d0d8992e610c85"
 * }
 * 
 * // Success response
 * {
 *   "success": true,
 *   "clientSecret": "pi_3Nk..._secret_...",
 *   "orderId": "60d21b4667d0d8992e610c85",
 *   "amount": 9999,
 *   "currency": "usd"
 * }
 */
router.post('/create-payment-intent', protectRoute, createPaymentIntent);

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (Stripe needs to access this endpoint)
 * 
 * @response {Object} 200 - Webhook received successfully
 * 
 * @note This endpoint should be configured in your Stripe Dashboard to receive events
 */
router.post('/webhook', 
  // Stripe needs the raw body to verify the webhook signature
  bodyParser.raw({ type: 'application/json' }), 
  handleWebhook
);

/**
 * @route   GET /api/payments/order/:orderId/status
 * @desc    Get payment status for an order
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @param   {string}  orderId        ID of the order to check
 * 
 * @response {Object} 200 - Payment status retrieved successfully
 * @response {Object} 401 - Unauthorized
 * @response {Object} 403 - Forbidden (order doesn't belong to user)
 * @response {Object} 404 - Order not found
 * 
 * @example
 * // Success response
 * {
 *   "success": true,
 *   "data": {
 *     "orderId": "60d21b4667d0d8992e610c85",
 *     "status": "processing",
 *     "paymentStatus": "paid",
 *     "amount": 9999,
 *     "currency": "usd",
 *     "paymentIntent": {
 *       "id": "pi_3Nk...",
 *       "status": "succeeded",
 *       "amount": 9999,
 *       "currency": "usd",
 *       "created": "2023-01-01T12:00:00.000Z",
 *       "paymentMethod": "card",
 *       "receiptUrl": "https://pay.stripe.com/receipts/..."
 *     }
 *   }
 * }
 */
router.get('/order/:orderId/status', protectRoute, getPaymentStatus);

/**
 * @route   POST /api/payment/create-checkout-session
 * @desc    Create a new Stripe Checkout Session
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @param   {string}  cartId         ID of the cart to checkout
 * @param   {string}  [couponCode]   Optional coupon code for discount
 * @param   {string}  successUrl     URL to redirect on successful payment
 * @param   {string}  cancelUrl      URL to redirect on cancelled payment
 * @returns {Object}  Stripe Checkout Session URL
 * 
 * @middleware protectRoute - Verifies JWT token
 * 
 * @response {Object} 200 - Checkout session created successfully
 * @response {Object} 400 - Invalid request data
 * @response {Object} 401 - Unauthorized
 * @response {Object} 404 - Cart not found
 * 
 * @example
 * // Request body
 * {
 *   "cartId": "60d21b4667d0d8992e610c85",
 *   "couponCode": "SUMMER25",
 *   "successUrl": "https://example.com/success",
 *   "cancelUrl": "https://example.com/cart"
 * }
 * 
 * // Success response
 * {
 *   "success": true,
 *   "url": "https://checkout.stripe.com/pay/cs_test_..."
 * }
 */
router.post('/create-checkout-session', protectRoute, createCheckoutSession);

/**
 * @route   POST /api/payment/checkout-success
 * @desc    Handle successful payment and create order
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @param   {string}  sessionId      Stripe Checkout Session ID
 * @returns {Object}  Order details
 * 
 * @middleware protectRoute - Verifies JWT token
 * 
 * @response {Object} 200 - Order created successfully
 * @response {Object} 400 - Invalid session ID
 * @response {Object} 401 - Unauthorized
 * @response {Object} 404 - Session not found
 * 
 * @example
 * // Request body
 * {
 *   "sessionId": "cs_test_1234567890"
 * }
 * 
 * // Success response
 * {
 *   "success": true,
 *   "order": {
 *     "id": "60d21b4667d0d8992e610c86",
 *     "amount": 9999,
 *     "status": "completed",
 *     "items": [...]
 *   }
 * }
 * 
 * // Error response
 * {
 *   "success": false,
 *   "error": "Payment session expired",
 *   "code": "SESSION_EXPIRED"
 * }
 */
router.post('/checkout-success', protectRoute, checkoutSuccess);

export default router;