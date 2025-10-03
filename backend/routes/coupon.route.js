import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { getCoupon, validateCoupon } from '../controllers/coupon.controller.js';

/**
 * Coupon Routes
 * 
 * This module provides API endpoints for managing and validating discount coupons.
 * All routes are protected and require authentication.
 * Users can check available coupons and validate them before applying to orders.
 */

const router = express.Router();

/**
 * @route   GET /api/coupon
 * @desc    Get all active coupons
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @returns {Object}  Array of active coupons
 * 
 * @middleware protectRoute - Verifies JWT token
 * 
 * @response {Object} 200 - Success response with coupons
 * @response {Object} 401 - Unauthorized (missing or invalid token)
 * 
 * @example
 * // Response example
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "code": "SUMMER25",
 *       "discount": 25,
 *       "expiresAt": "2023-12-31T23:59:59.000Z",
 *       "minPurchase": 50
 *     }
 *   ]
 * }
 */
router.get('/', protectRoute, getCoupon);

/**
 * @route   POST /api/coupon/validate
 * @desc    Validate a coupon code and get discount details
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @param   {string}  code          Coupon code to validate
 * @param   {number}  cartTotal     Current cart total (for minimum purchase validation)
 * @returns {Object}  Coupon validation result and discount details
 * 
 * @response {Object} 200 - Coupon is valid
 * @response {Object} 400 - Invalid request data
 * @response {Object} 404 - Coupon not found
 * @response {Object} 410 - Coupon expired
 * @response {Object} 401 - Unauthorized
 * 
 * @example
 * // Request body
 * {
 *   "code": "SUMMER25",
 *   "cartTotal": 100
 * }
 * 
 * // Success response
 * {
 *   "success": true,
 *   "data": {
 *     "code": "SUMMER25",
 *     "discount": 25,
 *     "discountAmount": 25,
 *     "newTotal": 75,
 *     "expiresAt": "2023-12-31T23:59:59.000Z"
 *   }
 * }
 * 
 * // Error response
 * {
 *   "success": false,
 *   "error": "Coupon has expired",
 *   "code": "COUPON_EXPIRED"
 * }
 */
router.post('/validate', protectRoute, validateCoupon);

export default router;