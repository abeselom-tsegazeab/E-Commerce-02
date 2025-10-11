import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import sessionMiddleware, { ensureSession } from '../config/session.config.js';
import {
  login,
  logout,
  register as signup,
  refreshToken,
  getProfile,
  updateProfile,
  googleAuth,
  googleCallback,
  googleAuthSuccess,
  googleAuthFailure
} from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { handleFileUpload } from '../middleware/upload.middleware.js';

/**
 * Authentication Routes
 * 
 * This module provides API endpoints for user authentication and session management.
 * Includes routes for user registration, login, logout, token refresh, and profile access.
 */

const router = express.Router();

/**
 * @route   GET /api/auth/test
 * @desc    Test API endpoint
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

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
 * @route   GET /api/auth/me
 * @desc    Get authenticated user's profile
 * @access  Private
 * @returns {Object}  User profile data
 * 
 * @middleware protectRoute - Verifies JWT token
 * 
 * @response {Object} 200 - User profile data
 * @response {Object} 401 - Unauthorized (missing or invalid token)
 */
router.get('/me', protectRoute, getProfile);

/**
 * @route   PUT /api/auth/update-profile
 * @access  Private
 * @param   {string}  [name]  User's name
 * @param   {string}  [phone]  User's phone number
 * @param   {file}    [avatar] User's avatar image file (jpeg, png, webp)
 * @returns {Object}  Updated user data
 *
 * @middleware protectRoute - Verifies JWT token
 * @middleware handleFileUpload - Handles file upload
 *
 * @response {Object} 200 - Profile updated successfully
 * @response {Object} 400 - No valid fields to update or invalid file
 * @response {Object} 401 - Unauthorized
 * @response {Object} 500 - Server error
 */
router.put('/update-profile', 
  // Logging middleware
  (req, res, next) => {
    console.log('\n=== Update Profile Route ===');
    console.log('Method:', req.method);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request body keys:', Object.keys(req.body || {}));
    console.log('Query params:', req.query);
    next();
  },
  
  // Authentication middleware
  protectRoute,
  
  // Body parser middleware for JSON requests
  express.json(),
  
  // File upload middleware (only for multipart/form-data)
  (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing as multipart/form-data');
      return handleFileUpload(req, res, (err) => {
        if (err) {
          console.error('Error in file upload middleware:', err);
          return res.status(400).json({
            success: false,
            message: err.message || 'Error processing file upload'
          });
        }
        next();
      });
    }
    
    console.log('Processing as JSON request');
    next();
  },
  
  // Update profile controller
  updateProfile
);

/**
 * @route   GET /api/auth/profile
 * @access  Private
{{ ... }}
 * @returns {Object}  User profile data
 * 
 * @middleware protectRoute - Verifies JWT token
 * 
 * @deprecated Use /me instead
 * @response {Object} 200 - User profile data
 * @response {Object} 401 - Unauthorized (missing or invalid token)
 */
router.get('/profile', protectRoute, getProfile);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth authentication
 * @access  Public
 * @query   {string} [redirect_uri] - URL to redirect to after authentication
 * @returns {void} Redirects to Google's OAuth consent screen
 */
router.get('/google', 
  (req, res, next) => {
    // Store the redirect_uri in the session
    if (req.query.redirect_uri) {
      req.session.redirect_uri = req.query.redirect_uri;
    }
    
    // Configure the authentication options
    const options = {
      scope: ['profile', 'email'],
      accessType: 'offline',
      prompt: 'consent',
      state: req.query.redirect_uri 
        ? Buffer.from(JSON.stringify({ redirect_uri: req.query.redirect_uri })).toString('base64')
        : undefined
    };
    
    // Initialize the authentication
    const authenticator = passport.authenticate('google', options);
    authenticator(req, res, next);
  }
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback URL
 * @access  Public
 * @param   {string}  [code]  Authorization code from Google
 * @param   {string}  [state]  State parameter for CSRF protection
 * @returns {void}    Redirects to the frontend with tokens
 */

// Google OAuth callback route with session support
router.get('/google/callback',
  // Ensure session is available
  ensureSession,
  // Handle the OAuth callback with Passport
  (req, res, next) => {
    try {
      console.log('Google OAuth callback received');
      
      // Parse the state parameter if it exists
      let redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/`;
      if (req.query.state) {
        try {
          const decodedState = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf-8'));
          if (decodedState.redirect_uri) {
            redirectUri = decodedState.redirect_uri;
          }
        } catch (error) {
          console.error('Error parsing state:', error);
        }
      }
      
      // Store the redirect URI in the session
      req.session.redirect_uri = redirectUri;
      
      // Save the session before authentication
      req.session.save(err => {
        if (err) {
          console.error('Error saving session:', err);
          return res.redirect(`${redirectUri}?error=session_error`);
        }
        
        // Proceed with authentication
        passport.authenticate('google', {
          failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`,
          session: true
        })(req, res, next);
      });
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=server_error`);
    }
  },
  
  // Success handler after Passport authentication
  (req, res) => {
    try {
      if (!req.user) {
        throw new Error('No user returned from Google OAuth');
      }

      // Get the redirect URI from session or use default
      const redirectUri = req.session?.redirect_uri || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/`;
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: req.user._id, 
          email: req.user.email,
          name: req.user.name,
          avatar: req.user.profilePicture || ''
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      // Common cookie options
      const cookieOptions = {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: '/',
        ...(process.env.NODE_ENV === 'production' && { domain: '.yourdomain.com' })
      };

      // Set the JWT token in an HTTP-only cookie
      res.cookie('token', token, {
        ...cookieOptions,
        httpOnly: true
      });

      // Set a non-httpOnly cookie for client-side access
      res.cookie('isAuthenticated', 'true', {
        ...cookieOptions,
        httpOnly: false
      });

      // Store user ID in session
      req.session.userId = req.user._id;
      
      // Save the session
      req.session.save(err => {
        if (err) {
          console.error('Error saving session:', err);
          return res.redirect(`${redirectUri}?error=session_error`);
        }
        
        // Redirect back to the frontend with success
        return res.redirect(redirectUri);
      });
    } catch (error) {
      console.error('Error in Google OAuth success handler:', error);
      const redirectUri = req.session?.redirect_uri || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/`;
      const errorUrl = new URL(redirectUri);
      errorUrl.searchParams.set('error', 'authentication_error');
      return res.redirect(errorUrl.toString());
    }
  }
);

export default router;