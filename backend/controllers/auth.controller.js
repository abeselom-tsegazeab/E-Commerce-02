/**
 * Authentication Controller
 *
 * This module handles user authentication including registration, login, logout,
 * token refresh, and profile management. It uses JWT for authentication and
 * Redis for token storage.
 */

import redis from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import passport from "passport";

// Helper Functions

/**
 * Generates a pair of JWT tokens (access and refresh)
 * @private
 * @param {string} userId - The user's ID
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = (userId) => {
  try {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(
      { userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new Error("Failed to generate authentication tokens");
  }
};

/**
 * Stores refresh token in Redis
 * @private
 * @param {string} userId - The user's ID
 * @param {string} refreshToken - The refresh token to store
 */
const storeRefreshToken = async (userId, refreshToken) => {
  try {
    await redis.set(
      `refresh_token:${userId}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60 // 7 days in seconds
    );
  } catch (error) {
    console.error("Error storing refresh token:", error);
    throw new Error("Failed to store refresh token");
  }
};

/**
 * Sets HTTP-only cookies for tokens
 * @private
 * @param {Object} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Development settings - more permissive
  const cookieOptions = {
    httpOnly: false,  // Allow JavaScript access in development
    secure: false,    // Allow HTTP in development
    sameSite: 'lax',  // More permissive for development
    path: '/',
  };

  // Production settings - more secure
  if (isProduction) {
    cookieOptions.secure = true;
    cookieOptions.httpOnly = true;  // More secure in production
    cookieOptions.sameSite = 'strict';
    cookieOptions.domain = process.env.FRONTEND_URL?.replace('http://', '').replace('https://', '');
  }

  // Access token cookie (15 minutes)
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh token cookie (7 days)
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  console.log('🍪 Cookies set:', {
    accessTokenLength: accessToken?.length,
    refreshTokenLength: refreshToken?.length,
    options: cookieOptions
  });
};

/**
 * Clears authentication cookies
 * @private
 * @param {Object} res - Express response object
 */
const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    domain: 'localhost',
  };
  
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

// Controller Methods

/**
 * @typedef {Object} UserResponse
 * @property {string} _id - The user's unique identifier
 * @property {string} name - The user's full name
 * @property {string} email - The user's email address
 * @property {string} role - The user's role (e.g., 'user', 'admin')
 */

/**
 * Registers a new user
 * @route POST /api/auth/register
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.name - User's full name
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user
    const user = await User.create({ name, email, password });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id.toString(), refreshToken);

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Return response (excluding password)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      user: userResponse,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Authenticates a user
 * @route POST /api/auth/login
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Verify password
    if (!password) {
      console.error('No password provided in login request');
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    console.log('Comparing password for user:', user.email);
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.error('Password comparison failed for user:', user.email);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id.toString(), refreshToken);

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Return response (excluding password)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse,
      accessToken, // Include the access token in the response
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Logs out a user
 * @route POST /api/auth/logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      try {
        // Verify and decode the token to get user ID
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );
        // Delete the refresh token from Redis
        await redis.del(`refresh_token:${decoded.userId}`);
      } catch (error) {
        // Token might be expired, but we still want to clear cookies
        console.log(
          "Token verification failed (possibly expired):",
          error.message
        );
      }
    }

    // Clear cookies
    clearAuthCookies(res);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Refreshes the access token
 * @route POST /api/auth/refresh-token
 * @param {Object} req - Express request object
 * @param {Object} req.cookies - Request cookies
 * @param {string} req.cookies.refreshToken - Refresh token
 * @param {Object} res - Express response object
 */
const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "No refresh token provided",
    });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if the refresh token exists in Redis
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      generateTokens(decoded.userId);

    // Update the refresh token in Redis
    await storeRefreshToken(decoded.userId, newRefreshToken);

    // Set new cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({
      success: true,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Token refresh error:", error);

    // Clear invalid refresh token
    clearAuthCookies(res);

    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Gets the current user's profile
 * @route GET /api/auth/me
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user (from auth middleware)
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    console.log('Request headers:', req.headers);
    console.log('Request user:', req.user);
    
    // The user is already attached to req.user by the auth middleware
    if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Ensure id exists before proceeding
    if (!req.user.id) {
      console.error('User object is missing id:', req.user);
      return res.status(500).json({
        success: false,
        message: "User data is incomplete"
      });
    }

    // Create a safe user object
    const safeUser = {
      id: req.user.id,  // Using req.user.id as set by the auth middleware
      name: req.user.name || 'User',
      email: req.user.email || '',
      role: req.user.role || 'customer',
      avatar: req.user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.name || 'U')}&background=10b981&color=fff`
    };
    
    console.log('Formatted user response:', safeUser);

    // Return the formatted user object
    res.status(200).json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

import { uploadImage } from '../lib/cloudinary.js';
import { unlinkSync } from 'fs';
import path from 'path';

/**
 * Updates a user's profile with optional file upload
 * @route PUT /api/auth/update-profile
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} [req.body.name] - User's name
 * @param {string} [req.body.phone] - User's phone number
 * @param {Object} req.file - Uploaded file object (if any)
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    // Debug log the incoming request
    console.log('=== Update Profile Controller ===');
    console.log('Request user:', req.user);
    console.log('Request body:', req.body);
    console.log('File:', req.file ? 'File received' : 'No file');

    if (!req.user || !req.user.id) {
      console.error('Authentication error: Missing user or user ID');
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        code: 'AUTH_ERROR'
      });
    }

    const { name, phone, email } = req.body;
    const updateData = {};
    let uploadedFile = null;

    // Handle file upload if exists
    if (req.file) {
      try {
        console.log('Uploading file to Cloudinary:', req.file.path);
        // Upload to Cloudinary using the imported uploadImage function
        const result = await uploadImage(req.file.path, {
          folder: 'ecommerce/avatars',
          transformation: [
            { width: 500, height: 500, crop: 'fill' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        });
        console.log('File uploaded to Cloudinary:', result.secure_url);
        
        updateData.avatar = result.secure_url;
        uploadedFile = req.file.path;
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        // Clean up the temporary file
        if (req.file?.path) {
          try { unlinkSync(req.file.path); } catch (e) {}
        }
        return res.status(500).json({
          success: false,
          message: 'Error uploading image'
        });
      }
    }

    // Add other fields to update
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    
    // Handle email update with validation
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }
      
      // Check if email is already in use by another user
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another account'
        });
      }
      
      updateData.email = email;
      updateData.isEmailVerified = false; // Reset email verification status when email is changed
    }

    if (Object.keys(updateData).length === 0) {
      // Clean up the temporary file if no other updates
      if (uploadedFile) {
        try { unlinkSync(uploadedFile); } catch (e) {}
      }
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    try {
      console.log('Updating user with ID:', req.user.id);
      console.log('Update data:', updateData);
      
      const user = await User.findByIdAndUpdate(
        req.user.id,  // Changed from req.user.userId to req.user.id
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');
      
      console.log('Updated user:', user ? 'User found' : 'User not found');

      if (!user) {
        throw new Error('User not found');
      }

      // Clean up the temporary file after successful update
      if (uploadedFile) {
        try { unlinkSync(uploadedFile); } catch (e) {}
      }

      res.status(200).json({
        success: true,
        user,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      // Clean up the temporary file if there was an error
      if (uploadedFile) {
        try { unlinkSync(uploadedFile); } catch (e) {}
      }
      throw error;
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Debug environment variables
console.log('Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'set' : 'missing',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'set' : 'missing',
  BACKEND_URL: process.env.BACKEND_URL || 'not set',
  FRONTEND_URL: process.env.FRONTEND_URL || 'not set'
});

// Google OAuth Handlers
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

/**
 * Exchanges authorization code for Google OAuth tokens
 * @param {string} code - Authorization code from Google
 * @param {string} redirectUri - Redirect URI used in the authorization request
 * @returns {Promise<Object>} Google OAuth tokens
 */
async function exchangeCodeForTokens(code, redirectUri, requestId = 'unknown') {
  const log = (message, data = {}) => {
    console.log(`[${requestId}] ${message}`, JSON.stringify({ ...data, timestamp: new Date().toISOString() }));
  };

  // OAuth client configuration with explicit settings
  const oauth2Client = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: redirectUri,
    // Force the use of the newer OAuth2 token endpoint
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    // Disable auto-refresh to prevent any automatic token refresh attempts
    eagerRefreshThresholdMillis: 0
  });

  // Log the configuration
  log('OAuth2Client configuration', {
    clientId: process.env.GOOGLE_CLIENT_ID ? 'set' : 'missing',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'set' : 'missing',
    redirectUri: redirectUri,
    tokenEndpoint: oauth2Client.tokenEndpoint
  });

  // Enable debug logging for the OAuth client
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      log('Refresh token received');
    }
    log('OAuth tokens event received', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'none',
      scope: tokens.scope
    });
  });

  log('OAuth Client Config', {
    clientId: process.env.GOOGLE_CLIENT_ID ? 'set' : 'missing',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'set' : 'missing',
    redirectUri: redirectUri
  });
  try {
    log('Exchanging code for tokens', {
      codeLength: code.length,
      redirectUri,
      clientConfigured: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
    });
    
    const tokenStartTime = Date.now();
    
    try {
      // Use oauth2Client for token exchange
      log('Exchanging code with oauth2Client', {
        redirectUri,
        codeSnippet: `${code.substring(0, 8)}...${code.substring(code.length - 4)}`
      });

      // Validate the authorization code
      if (!code || typeof code !== 'string' || code.length < 20) {
        throw new Error('Invalid authorization code format');
      }

      log('Exchanging authorization code for tokens', {
        codeLength: code.length,
        redirectUri,
        timestamp: new Date().toISOString()
      });

      try {
        // Get tokens using the OAuth2 client
        const tokenResponse = await oauth2Client.getToken({
          code,
          redirect_uri: redirectUri,
          // Include client ID and secret in the request
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET
        });
        
        const { tokens } = tokenResponse;
        
        if (!tokens) {
          throw new Error('No tokens received from Google');
        }
        
        // Verify the ID token
        try {
          const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
          });
          
          const payload = ticket.getPayload();
          log('ID Token verified', {
            email: payload.email,
            name: payload.name,
            email_verified: payload.email_verified
          });
          
          // Add the user info to the tokens object
          tokens.user = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture
          };
          
          return tokens;
          
        } catch (verifyError) {
          log('ID Token verification failed', {
            error: verifyError.message,
            stack: verifyError.stack
          });
          throw new Error('Failed to verify ID token');
        }
        
      } catch (error) {
        // Log detailed error information
        const errorDetails = {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          stack: error.stack
        };
        
        log('Token exchange failed with details:', errorDetails);
        
        // Provide more specific error messages
        if (error.message.includes('invalid_grant')) {
          throw new Error('The authorization code is invalid or has expired. Please try signing in again.');
        }
        
        throw new Error(`Authentication failed: ${error.message}`);
      }
      try {
        const ticket = await oauth2Client.verifyIdToken({
          idToken: tokens.id_token,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        log('ID Token verified', {
          email: payload.email,
          name: payload.name,
          email_verified: payload.email_verified
        });
        
        // Add the user info to the tokens object
        tokens.user = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture
        };
      } catch (verifyError) {
        log('ID Token verification failed', {
          error: verifyError.message,
          stack: verifyError.stack
        });
        throw new Error('Failed to verify ID token');
      }
      
      log('Token exchange successful', {
        duration: `${Date.now() - tokenStartTime}ms`,
        hasIdToken: !!tokens.id_token,
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token
      });
      
      return tokens;
    } catch (err) {
      const errorDetails = {
        message: err.message,
        code: err.code,
        response: err.response?.data || (err.response ? await err.response.text().catch(() => undefined) : undefined),
        headers: err.response?.headers ? Object.fromEntries(err.response.headers.entries()) : undefined,
        request: {
          method: err.config?.method,
          url: err.config?.url,
          data: err.config?.data
        },
        duration: `${Date.now() - tokenStartTime}ms`,
        stack: err.stack
      };
      
      log('Token exchange failed', errorDetails);
      
      // More specific error handling
      if (err.message.includes('invalid_grant') || (errorDetails.response && errorDetails.response.error === 'invalid_grant')) {
        throw new Error(`The authorization code is invalid or has expired. Please try signing in again. (${err.message})`);
      }
      
      throw new Error(`Authentication failed: ${err.message}`);
    }

    if (!tokens.id_token) {
      log('No ID token in response', { tokens: Object.keys(tokens) });
      throw new Error('No ID token received from Google');
    }

    return tokens;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      timestamp: new Date().toISOString(),
      redirect_uri_used: redirectUri,
      has_code: !!code,
      code_length: code ? code.length : 0
    };
    
    console.error('Token exchange error details:', JSON.stringify(errorDetails, null, 2));
    
    if (error.message.includes('invalid_grant')) {
      throw new Error('The authorization code is invalid or has expired. Please try signing in again.');
    } else if (error.message.includes('redirect_uri_mismatch')) {
      throw new Error('There was a configuration error with the authentication service. Please contact support.');
    }
    
    throw new Error('Failed to authenticate with Google. Please try again.');
  }
}

/**
 * Gets or creates a user based on Google profile
 * @param {Object} profile - Google profile information
 * @returns {Promise<Object>} User document
 */
async function getOrCreateUser(profile) {
  const { email, name, picture, sub, email_verified } = profile;
  
  console.log('Processing user:', { email, name, email_verified });
  
  let user = await User.findOne({ 'email': email });
  
  if (!user) {
    console.log('Creating new user...');
    user = new User({
      name: name,
      email: email,
      profilePicture: picture || '',
      isEmailVerified: email_verified || true,
      authProvider: {
        provider: 'google',
        id: sub
      }
    });
    await user.save();
  } else if (!user.authProvider?.provider) {
    // If user exists but doesn't have authProvider set
    user.authProvider = {
      provider: 'google',
      id: sub
    };
    user.profilePicture = user.profilePicture || picture || '';
    await user.save();
  }
  
  return user;
}

// Initialize OAuth2Client with environment variables
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.BACKEND_URL}${process.env.GOOGLE_CALLBACK_URL}`,
});

/**
 * Initiates Google OAuth flow
 * @route GET /api/auth/google
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const googleAuth = async (req, res) => {
  try {
    // Get redirect_uri from query params or use default
    const redirectUri =
      req.query.redirect_uri || `${process.env.FRONTEND_URL}/login`;

    // Generate the authorization URL with required scopes
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
        "openid",
      ],
      prompt: "consent",
      state: Buffer.from(
        JSON.stringify({ redirect_uri: redirectUri })
      ).toString("base64"),
      include_granted_scopes: true,
    });

    console.log("Initiating Google OAuth with redirect_uri:", redirectUri);
    console.log("Generated Auth URL:", authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error("Error in googleAuth:", error);
    const redirectUrl = `${process.env.FRONTEND_URL}/login?error=auth_error`;
    res.redirect(redirectUrl);
  }
};

/**
 * Handles Google OAuth callback
 * @route GET /api/auth/google/callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const googleCallback = async (req, res) => {
  const requestId = uuidv4();
  const log = (message, data = {}) => {
    console.log(`[${requestId}] ${message}`, JSON.stringify({ ...data, timestamp: new Date().toISOString() }));
  };
  
  try {
    const { code, state, error: authError } = req.query;
    
    log('Starting Google OAuth callback', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!authError,
      error: authError || 'none',
      timestamp: new Date().toISOString()
    });
    
    if (authError) {
      throw new Error(`Google OAuth error: ${authError}`);
    }
    
    if (!code) {
      log('No authorization code received');
      throw new Error('Authorization code is required');
    }
    
    // Log the incoming request details for debugging
    log('Incoming request details', {
      headers: req.headers,
      query: req.query,
      body: req.body,
      cookies: req.cookies,
      protocol: req.protocol,
      host: req.get('host'),
      originalUrl: req.originalUrl
    });
    
    // Exchange the authorization code for tokens
    log('Starting token exchange', { timestamp: new Date().toISOString() });
    const tokens = await exchangeCodeForTokens(code, requestId);
    
    if (!tokens || !tokens.id_token) {
      throw new Error('Failed to obtain tokens from Google');
    }
    
    // Verify the ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    log('ID Token verified', {
      email: payload.email,
      name: payload.name,
      email_verified: payload.email_verified
    });
    
    // Get or create user in our database
    const user = await getOrCreateUser({
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      email_verified: payload.email_verified,
      sub: payload.sub
    });
    
    // Create a JWT for our application
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Set the JWT as an HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Redirect to the frontend with success message
    const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:5173');
    redirectUrl.pathname = '/dashboard';
    redirectUrl.searchParams.set('auth', 'success');
    
    return res.redirect(redirectUrl.toString());
    
  } catch (error) {
    const errorMessage = error.message || 'Authentication failed';
    log('Error in googleCallback:', {
      error: errorMessage,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      redirect_uri_used: req.originalUrl,
      has_code: !!req.query.code,
      code_length: req.query.code?.length
    });
    
    // Redirect to the frontend with an error message
    const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:5173');
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('error', encodeURIComponent(errorMessage));
    
    return res.redirect(redirectUrl.toString());
  }
};

/**
 * Handles successful Google OAuth authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const googleAuthSuccess = (req, res) => {
  const requestId = uuidv4();
  const log = (message, data = {}) => {
    console.log(`[${requestId}] ${message}`, JSON.stringify({ ...data, timestamp: new Date().toISOString() }));
  };
  
  try {
    log('Google OAuth authentication successful', {
      user: req.user ? 'Authenticated' : 'No user',
      session: req.session ? 'Session exists' : 'No session'
    });
    
    // Get the redirect URL from the session or use the default
    const redirectUrl = req.session.redirect_uri || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;
    
    // Clear the redirect_uri from session
    delete req.session.redirect_uri;
    
    // Redirect to the frontend with the token
    return res.redirect(`${redirectUrl}?auth=success`);
    
  } catch (error) {
    log('Error in googleAuthSuccess:', {
      error: error.message,
      stack: error.stack
    });
    
    // If there's an error, redirect to the login page
    const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:5173');
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('error', 'authentication_failed');
    
    return res.redirect(redirectUrl.toString());
  }
};

/**
 * Handles failed Google OAuth authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const googleAuthFailure = (req, res) => {
  const requestId = uuidv4();
  const log = (message, data = {}) => {
    console.error(`[${requestId}] ${message}`, JSON.stringify({ ...data, timestamp: new Date().toISOString() }));
  };
  
  log('Google OAuth authentication failed', {
    query: req.query,
    session: req.session
  });
  
  // Redirect to the login page with an error message
  const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:5173');
  redirectUrl.pathname = '/login';
  redirectUrl.searchParams.set('error', 'authentication_failed');
  
  return res.redirect(redirectUrl.toString());
};

// Export all controller methods as named exports
export {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  googleAuth,
  googleCallback,
  googleAuthSuccess,
  googleAuthFailure
};
