import express from 'express';
import { 
  addToCart, 
  getCartProducts, 
  removeAllFromCart, 
  updateQuantity 
} from '../controllers/cart.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

/**
 * Cart Routes
 * 
 * This module provides API endpoints for managing user shopping carts.
 * All routes are protected and require authentication.
 * Users can only access and modify their own cart.
 */

const router = express.Router();

/**
 * @route   GET /api/cart
 * @desc    Get current user's cart items
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @returns {Object}  Array of cart items with product details
 * 
 * @middleware protectRoute - Verifies JWT token
 * 
 * @response {Object} 200 - Success response with cart items
 * @response {Object} 401 - Unauthorized (missing or invalid token)
 * 
 * @example
 * // Response example
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "product": { ... },
 *       "quantity": 2,
 *       "price": 1999
 *     }
 *   ]
 * }
 */
router.get('/', protectRoute, getCartProducts);

/**
 * @route   POST /api/cart
 * @desc    Add product to cart or update quantity if already exists
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @param   {string}  productId  ID of the product to add
 * @param   {number}  quantity   Quantity to add (default: 1)
 * @returns {Object}  Updated cart
 * 
 * @response {Object} 201 - Product added to cart
 * @response {Object} 400 - Invalid product ID or quantity
 * @response {Object} 404 - Product not found
 * @response {Object} 401 - Unauthorized
 * 
 * @example
 * // Request body
 * {
 *   "productId": "60d21b4667d0d8992e610c85",
 *   "quantity": 1
 * }
 */
router.post('/', protectRoute, addToCart);

/**
 * @route   PUT /api/cart/:id
 * @desc    Update quantity of a product in cart
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @param   {string}  id        Cart item ID
 * @param   {number}  quantity  New quantity (must be >= 1)
 * @returns {Object}  Updated cart item
 * 
 * @response {Object} 200 - Cart item updated
 * @response {Object} 400 - Invalid quantity
 * @response {Object} 404 - Cart item not found
 * @response {Object} 401 - Unauthorized
 * 
 * @example
 * // Request body
 * {
 *   "quantity": 3
 * }
 */
router.put('/:id', protectRoute, updateQuantity);

/**
 * @route   DELETE /api/cart
 * @desc    Remove all items from cart
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @returns {Object}  Success message
 * 
 * @response {Object} 200 - Cart cleared successfully
 * @response {Object} 401 - Unauthorized
 * 
 * @example
 * // Response
 * {
 *   "success": true,
 *   "message": "Cart cleared successfully"
 * }
 */
router.delete('/', protectRoute, removeAllFromCart);

export default router;