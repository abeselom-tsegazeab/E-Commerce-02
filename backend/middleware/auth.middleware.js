import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

/**
 * Authentication Middleware
 * 
 * This module provides middleware functions for handling authentication and authorization:
 * - protectRoute: Verifies JWT tokens and attaches user to request
 * - adminRoute: Restricts access to admin users only
 */

/**
 * Protect Route Middleware
 * 
 * Verifies the JWT access token from cookies and attaches the authenticated user to the request object.
 * Handles various error cases including missing tokens, expired tokens, and invalid users.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void|Object} - Either calls next() or returns an error response
 */
export const protectRoute = async (req, res, next) => {
    try {
        console.log('=== protectRoute Middleware ===');
        console.log('Request URL:', req.originalUrl);
        console.log('Request Headers:', {
            host: req.headers.host,
            origin: req.headers.origin,
            referer: req.headers.referer,
            cookie: req.headers.cookie ? '*** Cookie present ***' : 'No cookie header',
            authorization: req.headers.authorization ? '*** Authorization header present ***' : 'No authorization header'
        });
        
        // 1. Extract access token from Authorization header or cookies
        let accessToken;
        
        // Check Authorization header first
        const authHeader = req.headers.authorization;
        if (authHeader) {
            // Trim and split the header to handle extra spaces
            const parts = authHeader.trim().split(/\s+/);
            if (parts.length >= 2 && parts[0].toLowerCase() === 'bearer') {
                accessToken = parts[1];
                console.log('Found access token in Authorization header');
            }
        }
        // Fall back to cookies if not in header
        else if (req.cookies && req.cookies.accessToken) {
            accessToken = req.cookies.accessToken;
            console.log('Found access token in cookies');
        } else {
            console.log('No access token found in headers or cookies');
        }

        // 2. Check if token exists
        if (!accessToken) {
            console.log('No access token found in headers or cookies');
            return res.status(401).json({ 
                success: false,
                message: 'Unauthorized - No access token provided' 
            });
        }

        try {
            console.log('Verifying access token...');
            
            // 3. Verify the JWT token
            let decoded;
            try {
                decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
                console.log('Token verified successfully. Decoded:', {
                    userId: decoded.userId || decoded.id || decoded._id,
                    iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null,
                    exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
                    now: new Date().toISOString()
                });
            } catch (verifyError) {
                console.error('Token verification failed:', {
                    name: verifyError.name,
                    message: verifyError.message,
                    expiredAt: verifyError.expiredAt ? new Date(verifyError.expiredAt).toISOString() : null,
                    now: new Date().toISOString()
                });
                throw verifyError;
            }
            
            // 4. Find user by ID from token, excluding password
            // Try different possible ID fields
            const userId = decoded.userId || decoded.id || decoded._id;
            if (!userId) {
                console.error('No user ID found in token');
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token - No user ID found'
                });
            }
            
            console.log('Looking up user with ID:', userId);
            const user = await User.findById(userId).select('-password');

            // 5. Check if user exists
            if (!user) {
                console.error('User not found in database');
                return res.status(401).json({ 
                    success: false,
                    message: 'Unauthorized - User not found' 
                });
            }
            
            console.log('User found:', {
                id: user._id,
                email: user.email,
                role: user.role
            });

            // 6. Attach user to request object for subsequent middleware
            req.user = user;

            // 7. Proceed to the next middleware
            next();
        } catch (error) {
            // 8. Handle specific JWT errors
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false,
                    message: 'Unauthorized - Access token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    success: false,
                    message: 'Unauthorized - Invalid token',
                    code: 'INVALID_TOKEN'
                });
            }
            throw error; // Re-throw other errors
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ 
            success: false,
            message: 'Unauthorized - Invalid authentication',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Admin Route Middleware
 * 
 * Restricts access to admin users only. Must be used after protectRoute middleware.
 * 
 * @param {Object} req - Express request object (must have user attached by protectRoute)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void|Object} - Either calls next() or returns a 403 Forbidden response
 */
export const adminRoute = (req, res, next) => {
    // 1. Check if user is authenticated and has admin role
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    // 2. Return 403 Forbidden if not an admin
    return res.status(403).json({ 
        success: false,
        message: 'Access denied - Admin privileges required',
        code: 'ADMIN_ACCESS_REQUIRED'
    });
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Restricts access to users with specific roles
 * 
 * @param {string[]} allowedRoles - Array of role names that are allowed
 * @returns {Function} - Middleware function
 */
export const roleCheck = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false,
                message: `Access denied - Requires one of these roles: ${allowedRoles.join(', ')}`,
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};