import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { 
  checkoutSuccess, 
  createCheckoutSession 
} from '../controllers/payment.controller.js';

/**
 * Payment Routes
 * 
 * This module provides API endpoints for processing payments and handling
 * payment-related operations using Stripe.
 * All routes are protected and require authentication.
 */

const router = express.Router();

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