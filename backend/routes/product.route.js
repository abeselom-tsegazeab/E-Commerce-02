import express from 'express';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getRecommendedProducts,
  toggleFeaturedProduct,
} from '../controllers/product.controller.js';
import { adminRoute, protectRoute } from '../middleware/auth.middleware.js';

/**
 * Product Routes
 * 
 * This module provides API endpoints for managing products in the e-commerce system.
 * Includes routes for CRUD operations, featured products, and product recommendations.
 * Admin privileges are required for create, update, and delete operations.
 */

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products (Admin only)
 * @access  Private/Admin
 * @header  {string}  Authorization  Bearer token
 * @query   {number}  [page=1]       Page number for pagination
 * @query   {number}  [limit=10]     Number of items per page
 * @query   {string}  [sort=-createdAt]  Sort field and order (- for descending)
 * @returns {Object}  Paginated list of all products
 * 
 * @middleware protectRoute - Verifies JWT token
 * @middleware adminRoute - Restricts access to admin users
 * 
 * @response {Object} 200 - Success response with products
 * @response {Object} 401 - Unauthorized
 * @response {Object} 403 - Forbidden (not an admin)
 * 
 * @example
 * // Request
 * GET /api/products?page=1&limit=20&sort=-price
 * 
 * // Response
 * {
 *   "success": true,
 *   "data": [...],
 *   "pagination": {
 *     "total": 100,
 *     "page": 1,
 *     "pages": 5,
 *     "limit": 20
 *   }
 * }
 */
router.get('/', protectRoute, adminRoute, getAllProducts);

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 * @query   {number}  [limit=4]  Maximum number of featured products to return
 * @returns {Object}  List of featured products
 * 
 * @response {Object} 200 - Success response with featured products
 * 
 * @example
 * // Response
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "60d21b4667d0d8992e610c85",
 *       "name": "Premium Headphones",
 *       "price": 19999,
 *       "image": "/images/headphones.jpg",
 *       "featured": true
 *     }
 *   ]
 * }
 */
router.get('/featured', getFeaturedProducts);

/**
 * @route   GET /api/products/category/:category
 * @desc    Get products by category
 * @access  Public
 * @param   {string}  category  Category name (case-insensitive)
 * @query   {number}  [page=1]  Page number for pagination
 * @query   {number}  [limit=12] Items per page
 * @returns {Object}  Paginated list of products in the specified category
 * 
 * @response {Object} 200 - Success response with products
 * @response {Object} 404 - Category not found
 * 
 * @example
 * // Request
 * GET /api/products/category/electronics?page=1&limit=12
 */
router.get('/category/:category', getProductsByCategory);

/**
 * @route   GET /api/products/recommendations
 * @desc    Get recommended products for the current user
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @query   {number}  [limit=4]  Maximum number of recommendations
 * @returns {Object}  List of recommended products
 * 
 * @middleware protectRoute - Verifies JWT token
 * 
 * @response {Object} 200 - Success response with recommended products
 * @response {Object} 401 - Unauthorized
 */
router.get('/recommendations', protectRoute, getRecommendedProducts);

/**
 * @route   POST /api/products
 * @desc    Create a new product (Admin only)
 * @access  Private/Admin
 * @header  {string}  Authorization  Bearer token
 * @param   {string}  name         Product name
 * @param   {string}  description  Product description
 * @param   {number}  price        Product price in smallest currency unit (e.g., cents)
 * @param   {string}  category     Product category
 * @param   {string}  image        Product image URL
 * @param   {number}  [stock=0]    Available stock quantity
 * @returns {Object}  Created product
 * 
 * @middleware protectRoute - Verifies JWT token
 * @middleware adminRoute - Restricts access to admin users
 * 
 * @response {Object} 201 - Product created successfully
 * @response {Object} 400 - Invalid input data
 * @response {Object} 401 - Unauthorized
 * @response {Object} 403 - Forbidden (not an admin)
 * 
 * @example
 * // Request body
 * {
 *   "name": "Wireless Earbuds",
 *   "description": "High-quality wireless earbuds with noise cancellation",
 *   "price": 12999,
 *   "category": "Electronics",
 *   "image": "/images/earbuds.jpg",
 *   "stock": 50
 * }
 */
router.post('/', protectRoute, adminRoute, createProduct);

/**
 * @route   PATCH /api/products/:id
 * @desc    Toggle featured status of a product (Admin only)
 * @access  Private/Admin
 * @header  {string}  Authorization  Bearer token
 * @param   {string}  id  Product ID
 * @returns {Object}  Updated product
 * 
 * @middleware protectRoute - Verifies JWT token
 * @middleware adminRoute - Restricts access to admin users
 * 
 * @response {Object} 200 - Product updated successfully
 * @response {Object} 404 - Product not found
 * @response {Object} 401 - Unauthorized
 * @response {Object} 403 - Forbidden (not an admin)
 */
router.patch('/:id', protectRoute, adminRoute, toggleFeaturedProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product (Admin only)
 * @access  Private/Admin
 * @header  {string}  Authorization  Bearer token
 * @param   {string}  id  Product ID
 * @returns {Object}  Success message
 * 
 * @middleware protectRoute - Verifies JWT token
 * @middleware adminRoute - Restricts access to admin users
 * 
 * @response {Object} 200 - Product deleted successfully
 * @response {Object} 404 - Product not found
 * @response {Object} 401 - Unauthorized
 * @response {Object} 403 - Forbidden (not an admin)
 * 
 * @example
 * // Response
 * {
 *   "success": true,
 *   "message": "Product deleted successfully"
 * }
 */
router.delete('/:id', protectRoute, adminRoute, deleteProduct);

export default router;