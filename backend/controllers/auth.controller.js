/**
 * Authentication Controller
 * 
 * This module handles user authentication including registration, login, logout,
 * token refresh, and profile management. It uses JWT for authentication and
 * Redis for token storage.
 * 
 * @module controllers/auth
 * @requires ../lib/redis
 * @requires ../models/user.model
 * @requires jsonwebtoken
 */

import redis from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

/**
 * Generates a pair of JWT tokens (access and refresh) for user authentication.
 * The access token is short-lived (15 minutes) for security, while the refresh token
 * has a longer lifespan (7 days) to allow for seamless session renewal without
 * requiring the user to log in again.
 * 
 * @private
 * @param {string} userId - The unique MongoDB ObjectId of the user
 * @returns {Object} Object containing:
 *   - {string} accessToken - JWT token for API authentication (15m expiry)
 *   - {string} refreshToken - JWT token for obtaining new access tokens (7d expiry)
 * @throws {Error} If JWT signing fails or environment variables are missing
 * @example
 * const { accessToken, refreshToken } = generateTokens('507f1f77bcf86cd799439011');
 */
const generateTokens = (userId) => {
    try {
        const accessToken = jwt.sign(
            { userId }, 
            process.env.ACCESS_TOKEN_SECRET, 
            { expiresIn: "15m" }  // Short-lived access token
        );

        const refreshToken = jwt.sign(
            { userId }, 
            process.env.REFRESH_TOKEN_SECRET, 
            { expiresIn: "7d" }  // Longer-lived refresh token
        );

        return { accessToken, refreshToken };
    } catch (error) {
        console.error('Error generating tokens:', error);
        throw new Error('Failed to generate authentication tokens');
    }
};

/**
 * Stores a refresh token in Redis with a 7-day expiration time.
 * This function is crucial for maintaining secure user sessions by persisting
 * refresh tokens in a fast, in-memory data store. The token is automatically
 * removed after 7 days to enforce security best practices.
 * 
 * @private
 * @param {string} userId - The unique MongoDB ObjectId of the user
 * @param {string} refreshToken - The JWT refresh token to be stored
 * @throws {Error} If Redis connection fails or token storage is unsuccessful
 * @example
 * await storeRefreshToken('507f1f77bcf86cd799439011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 */
const storeRefreshToken = async (userId, refreshToken) => {
    try {
        await redis.set(
            `refresh_token:${userId}`, 
            refreshToken, 
            "EX", 
            7 * 24 * 60 * 60  // 7 days in seconds
        );
    } catch (error) {
        console.error('Error storing refresh token:', error);
        throw new Error('Failed to store refresh token');
    }
};

/**
 * Configures and sets HTTP-only, secure cookies for authentication tokens.
 * This function implements security best practices by:
 * - Setting httpOnly flag to prevent XSS attacks
 * - Enforcing HTTPS in production environments
 * - Using strict same-site policy to prevent CSRF attacks
 * - Setting appropriate max-age values for each token type
 * 
 * @private
 * @param {Object} res - Express response object for setting cookies
 * @param {string} accessToken - Short-lived JWT access token (15 minutes)
 * @param {string} refreshToken - Long-lived JWT refresh token (7 days)
 * @example
 * setCookies(res, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 */
const setCookies = (res, accessToken, refreshToken) => {
    // Access token cookie settings
    res.cookie("accessToken", accessToken, {
        httpOnly: true,  // Prevents XSS attacks
        secure: process.env.NODE_ENV === "production",  // HTTPS only in production
        sameSite: "strict",  // Prevents CSRF attacks
        maxAge: 15 * 60 * 1000,  // 15 minutes
    });

    // Refresh token cookie settings
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    });
};

/**
 * @typedef {Object} UserResponse
 * @property {string} _id - The user's unique identifier
 * @property {string} name - The user's full name
 * @property {string} email - The user's email address
 * @property {string} role - The user's role (e.g., 'user', 'admin')
 */

/**
 * Registers a new user in the system.
 * 
 * This endpoint performs the following operations:
 * 1. Validates required fields (name, email, password)
 * 2. Checks for existing users with the same email
 * 3. Hashes the password using bcrypt
 * 4. Creates a new user document in MongoDB
 * 5. Generates JWT tokens
 * 6. Sets secure HTTP-only cookies
 * 7. Returns the created user data (excluding sensitive information)
 * 
 * @route POST /api/auth/signup
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.name - User's full name (2-50 characters)
 * @param {string} req.body.email - Valid email address
 * @param {string} req.body.password - Password (min 8 chars, at least 1 letter and 1 number)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {400} If required fields are missing or invalid
 * @throws {400} If user with email already exists
 * @throws {500} If server error occurs during registration
 * @example
 * // Request
 * POST /api/auth/signup
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "SecurePass123"
 * }
 * 
 * // Success Response (201)
 * {
 *   "success": true,
 *   "user": {
 *     "_id": "507f1f77bcf86cd799439011",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "user"
 *   },
 *   "message": "Registration successful"
 * }
 */
export const signup = async (req, res) => {
    const { email, password, name } = req.body;
    
    try {
        // Input validation
        if (!email || !password || !name) {
            return res.status(400).json({ 
                success: false,
                message: "Please provide all required fields" 
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ 
                success: false,
                message: "User with this email already exists" 
            });
        }

        // Create new user
        const user = await User.create({ 
            name, 
            email, 
            password 
        });

        // Generate tokens and set cookies
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        // Return user data (excluding password)
        res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            message: "Registration successful"
        });

    } catch (error) {
        console.error("Error in signup controller:", error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error during registration",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Authenticates a user and issues JWT tokens upon successful login.
 * 
 * This endpoint performs the following operations:
 * 1. Validates the presence of email and password
 * 2. Verifies the user exists and the password is correct
 * 3. Generates new JWT access and refresh tokens
 * 4. Stores the refresh token in Redis
 * 5. Sets secure HTTP-only cookies with both tokens
 * 6. Returns the authenticated user's information
 * 
 * @route POST /api/auth/login
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User's registered email address
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {400} If email or password is missing
 * @throws {401} If authentication fails (invalid credentials)
 * @throws {500} If server error occurs during authentication
 * @example
 * // Request
 * POST /api/auth/login
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123"
 * }
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "user": {
 *     "_id": "507f1f77bcf86cd799439011",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "user"
 *   },
 *   "message": "Login successful"
 * }
 */
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Input validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Please provide both email and password" 
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        
        // Check if user exists and password is correct
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid email or password" 
            });
        }

        // Generate tokens and set cookies
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        // Return user data
        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            message: "Login successful"
        });

    } catch (error) {
        console.error("Error in login controller:", error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error during login",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Handles user logout
 * @route POST /api/auth/logout
 * @param {Object} req - Express request object
 * @param {Object} req.cookies - Request cookies
 * @param {string} [req.cookies.refreshToken] - Refresh token from cookies
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                await redis.del(`refresh_token:${decoded.userId}`);
            } catch (error) {
                // Token might be expired, but we still want to clear cookies
                console.log("Error during token invalidation (possibly expired):", error.message);
            }
        }

        // Clear cookies
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        
        res.json({ 
            success: true,
            message: "Logged out successfully" 
        });

    } catch (error) {
        console.error("Error in logout controller:", error);
        res.status(500).json({ 
            success: false,
            message: "Error during logout",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Refreshes the access token using a valid refresh token
 * @route POST /api/auth/refresh-token
 * @param {Object} req - Express request object
 * @param {Object} req.cookies - Request cookies
 * @param {string} [req.cookies.refreshToken] - Refresh token from cookies
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ 
                success: false,
                message: "No refresh token provided" 
            });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch (error) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid or expired refresh token" 
            });
        }

        // Check if refresh token exists in Redis
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
        if (storedToken !== refreshToken) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid refresh token" 
            });
        }

        // Generate new access token
        const accessToken = jwt.sign(
            { userId: decoded.userId }, 
            process.env.ACCESS_TOKEN_SECRET, 
            { expiresIn: "15m" }
        );

        // Set new access token in cookie
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,  // 15 minutes
        });

        res.json({ 
            success: true,
            message: "Token refreshed successfully" 
        });

    } catch (error) {
        console.error("Error in refreshToken controller:", error);
        res.status(500).json({ 
            success: false,
            message: "Error refreshing token",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Gets the current authenticated user's profile
 * @route GET /api/auth/profile
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object (attached by auth middleware)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getProfile = async (req, res) => {
    try {
        // The user object is attached to the request by the auth middleware
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: "Not authenticated" 
            });
        }

        // Return user data (excluding sensitive information)
        const { password, ...userData } = req.user._doc;
        
        res.json({ 
            success: true,
            user: userData 
        });

    } catch (error) {
        console.error("Error in getProfile controller:", error);
        res.status(500).json({ 
            success: false,
            message: "Error retrieving user profile",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
