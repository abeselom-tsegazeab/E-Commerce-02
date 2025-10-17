import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  addToComparison,
  getComparison,
  removeFromComparison,
  clearComparison,
  getComparisonAttributes
} from '../controllers/comparison.controller.js';

/**
 * Comparison Routes
 * 
 * This module provides API endpoints for managing product comparisons.
 * All routes are protected and require authentication.
 * Users can compare products based on their attributes.
 */

const router = express.Router();

/**
 * @route   GET /api/comparison
 * @desc    Get user's comparison list with product details
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @returns {Object}  Comparison list with products and their attributes
 */
router.get('/', protectRoute, getComparison);

/**
 * @route   POST /api/comparison
 * @desc    Add product to comparison list
 * @access  Private
 * @param   {string}  productId  ID of the product to add
 * @returns {Object}  Updated comparison list
 */
router.post('/', protectRoute, addToComparison);

/**
 * @route   DELETE /api/comparison/:productId
 * @desc    Remove product from comparison list
 * @access  Private
 * @param   {string}  productId  ID of the product to remove
 * @returns {Object}  Updated comparison list
 */
router.delete('/:productId', protectRoute, removeFromComparison);

/**
 * @route   DELETE /api/comparison
 * @desc    Clear all products from comparison list
 * @access  Private
 * @returns {Object}  Empty comparison list
 */
router.delete('/', protectRoute, clearComparison);

/**
 * @route   GET /api/comparison/attributes
 * @desc    Get common attributes for products in comparison
 * @access  Private
 * @returns {Object}  List of common attributes with values for each product
 */
router.get('/attributes', protectRoute, getComparisonAttributes);

export default router;
