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
        // 1. Extract access token from cookies
        const accessToken = req.cookies.accessToken;

        // 2. Check if token exists
        if (!accessToken) {
            return res.status(401).json({ 
                success: false,
                message: 'Unauthorized - No access token provided' 
            });
        }

        try {
            // 3. Verify the JWT token
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            
            // 4. Find user by ID from token, excluding password
            const user = await User.findById(decoded.userId).select('-password');

            // 5. Check if user exists
            if (!user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Unauthorized - User not found' 
                });
            }

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