/**
 * Coupon Controller
 * 
 * This module handles all coupon-related operations including retrieving active coupons,
 * validating coupon codes, and applying discounts. It ensures coupons are valid, not expired,
 * and properly associated with the requesting user.
 * 
 * @module controllers/coupon
 * @requires ../models/coupon.model
 * @requires ../models/user.model
 */

import Coupon from "../models/coupon.model.js";

/**
 * @typedef {Object} CouponResponse
 * @property {string} _id - Coupon ID
 * @property {string} code - Coupon code
 * @property {number} discountPercentage - Discount percentage (0-100)
 * @property {Date} expirationDate - Expiration date of the coupon
 * @property {boolean} isActive - Whether the coupon is active
 * @property {string} userId - ID of the user this coupon belongs to
 * @property {Date} createdAt - When the coupon was created
 * @property {Date} updatedAt - When the coupon was last updated
 */

/**
 * Retrieves the currently active coupon for the authenticated user.
 * Only returns coupons that are marked as active and not expired.
 * 
 * @async
 * @function getCoupon
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user._id - ID of the authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {500} If there's a server error during the operation
 * @example
 * // GET /api/coupons/active
 * // Response: 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "507f1f77bcf86cd799439011",
 *     "code": "SUMMER20",
 *     "discountPercentage": 20,
 *     "expirationDate": "2023-12-31T23:59:59.999Z",
 *     "isActive": true,
 *     "userId": "507f1f77bcf86cd799439012",
 *     "createdAt": "2023-01-01T00:00:00.000Z",
 *     "updatedAt": "2023-01-01T00:00:00.000Z"
 *   }
 * }
 */
export const getCoupon = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find active coupon for the user
        const coupon = await Coupon.findOne({ 
            userId,
            isActive: true,
            expirationDate: { $gt: new Date() } // Only return non-expired coupons
        }).select('-__v');
        
        if (!coupon) {
            return res.status(200).json({
                success: true,
                data: null,
                message: 'No active coupon found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: coupon,
            message: 'Active coupon retrieved successfully'
        });
        
    } catch (error) {
        console.error('Error in getCoupon:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve coupon',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Validates a coupon code and returns its details if valid.
 * Checks if the coupon exists, is active, not expired, and belongs to the user.
 * Automatically deactivates expired coupons.
 * 
 * @async
 * @function validateCoupon
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.code - The coupon code to validate
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user._id - ID of the authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {400} If coupon code is missing or invalid
 * @throws {404} If coupon is not found, expired, or not active
 * @throws {500} If there's a server error during the operation
 * @example
 * // POST /api/coupons/validate
 * // Request body: { "code": "SUMMER20" }
 * // Response: 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "code": "SUMMER20",
 *     "discountPercentage": 20,
 *     "expirationDate": "2023-12-31T23:59:59.999Z",
 *     "message": "Coupon is valid"
 *   }
 * }
 */
export const validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        
        // Validate input
        if (!code || typeof code !== 'string' || code.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Coupon code is required and must be a non-empty string'
            });
        }
        
        // Find the coupon
        const coupon = await Coupon.findOne({ 
            code: code.trim().toUpperCase(),
            userId: req.user._id,
            isActive: true
        });

        // Check if coupon exists and is active
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found or inactive'
            });
        }
        
        const now = new Date();
        
        // Check if coupon is expired
        if (coupon.expirationDate < now) {
            // Deactivate expired coupon
            coupon.isActive = false;
            await coupon.save();
            
            return res.status(400).json({
                success: false,
                message: 'This coupon has expired',
                expired: true,
                expirationDate: coupon.expirationDate
            });
        }
        
        // Check if coupon has already been used (if applicable)
        if (coupon.maxUses > 0 && coupon.uses >= coupon.maxUses) {
            return res.status(400).json({
                success: false,
                message: 'This coupon has reached its maximum usage limit'
            });
        }
        
        // Check minimum purchase requirement (if any)
        if (coupon.minPurchaseAmount > 0) {
            // You would typically check the cart total here
            // For now, we'll include it in the response
            return res.status(200).json({
                success: true,
                data: {
                    code: coupon.code,
                    discountPercentage: coupon.discountPercentage,
                    expirationDate: coupon.expirationDate,
                    minPurchaseAmount: coupon.minPurchaseAmount,
                    message: 'Coupon is valid (minimum purchase required)'
                }
            });
        }
        
        // Return valid coupon details
        res.status(200).json({
            success: true,
            data: {
                code: coupon.code,
                discountPercentage: coupon.discountPercentage,
                expirationDate: coupon.expirationDate,
                message: 'Coupon is valid'
            }
        });
        
    } catch (error) {
        console.error('Error in validateCoupon:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate coupon',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
