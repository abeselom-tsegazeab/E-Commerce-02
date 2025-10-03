import express from 'express';
import { 
  login, 
  logout, 
  signup, 
  refreshToken, 
  getProfile 
} from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

/**
 * Authentication Routes
 * 
 * This module provides API endpoints for user authentication and session management.
 * Includes routes for user registration, login, logout, token refresh, and profile access.
 */

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 * @param   {string}  username  User's username
 * @param   {string}  email     User's email
 * @param   {string}  password  User's password (min 6 chars)
 * @param   {string}  [fullName] User's full name (optional)
 * @returns {Object}  User data and authentication tokens
 * 
 * @response {Object} 201 - User created successfully
 * @response {Object} 400 - Invalid input data
 * @response {Object} 409 - Email already registered
 * 
 * @example
 * // Request body
 * {
 *   "username": "johndoe",
 *   "email": "john@example.com",
 *   "password": "secure123"
 * }
 */
router.post('/signup', signup);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get tokens
 * @access  Public
 * @param   {string}  email     User's email
 * @param   {string}  password  User's password
 * @returns {Object}  Access token and refresh token
 * 
 * @response {Object} 200 - Login successful
 * @response {Object} 400 - Missing credentials
 * @response {Object} 401 - Invalid credentials
 * 
 * @example
 * // Request body
 * {
 *   "email": "john@example.com",
 *   "password": "secure123"
 * }
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/logout
 * @desc    Invalidate user session
 * @access  Public
 * @param   {string}  refreshToken  User's refresh token
 * @returns {Object}  Success message
 * 
 * @response {Object} 200 - Logout successful
 * @response {Object} 400 - Missing refresh token
 * 
 * @example
 * // Request body
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
router.post('/logout', logout);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Get new access token using refresh token
 * @access  Public
 * @param   {string}  refreshToken  Valid refresh token
 * @returns {Object}  New access token
 * 
 * @response {Object} 200 - New tokens generated
 * @response {Object} 400 - Missing refresh token
 * @response {Object} 403 - Invalid refresh token
 * 
 * @example
 * // Request body
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   GET /api/auth/profile
 * @desc    Get authenticated user's profile
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @returns {Object}  User profile data
 * 
 * @middleware protectRoute - Verifies JWT token
 * 
 * @response {Object} 200 - User profile data
 * @response {Object} 401 - Unauthorized (missing or invalid token)
 * 
 * @example
 * // Request headers
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
router.get('/profile', protectRoute, getProfile);

export default router;