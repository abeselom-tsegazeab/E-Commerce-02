import mongoose from 'mongoose';
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

/**
 * Retrieves all products in the authenticated user's cart with their details.
 * This function populates the cart items with full product information
 * from the products collection.
 * 
 * @async
 * @function getCartProducts
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getCartProducts = async (req, res) => {
    try {
        // Ensure user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        // Get the user with populated cart items
        const userWithCart = await User.findById(req.user._id)
            .populate({
                path: 'cartItems.product',
                select: 'name price images stock isActive inventory',
                match: { isDeleted: { $ne: true } }
            });
            
        if (!userWithCart) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Filter out any null products (from the match condition)
        const validCartItems = (userWithCart.cartItems || []).filter(item => item && item.product);

        // If no valid cart items, return empty array
        if (!validCartItems.length) {
            return res.status(200).json({
                success: true,
                data: {
                    items: [],
                    summary: {
                        totalItems: 0,
                        subtotal: 0,
                        shipping: 0,
                        discount: 0,
                        total: 0,
                        currency: "USD"
                    }
                }
            });
        }

        // Format the cart items
        const populatedCartItems = [];
        let totalItems = 0;
        let subtotal = 0;
        
        for (const cartItem of validCartItems) {
            const product = cartItem.product;
            const quantity = cartItem.quantity || 1;
            const availableStock = product.inventory?.quantity ?? product.stock ?? 0;
            const inStock = availableStock >= quantity;
            const price = product.price || 0;
            
            // Calculate line total
            const lineTotal = price * quantity;
            subtotal += lineTotal;
            totalItems += quantity;
            
            populatedCartItems.push({
                _id: product._id,
                name: product.name,
                price: price,
                images: product.images || [],
                quantity: quantity,
                inStock: inStock,
                availableStock: availableStock,
                cartItemId: cartItem._id,
                primaryImage: (product.images?.[0]?.url) || ''
            });
        }

        // Calculate summary
        const summary = {
            totalItems: totalItems,
            subtotal: subtotal,
            shipping: subtotal > 50 ? 0 : 10, // Free shipping over $50
            discount: 0,
            total: subtotal + (subtotal > 50 ? 0 : 10), // Add shipping to total
            currency: 'USD'
        };
        
        // Calculate estimated delivery date (7 days from now)
        const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        // Return the cart with populated items
        return res.status(200).json({
            success: true,
            data: {
                items: populatedCartItems,
                summary: {
                    ...summary,
                    estimatedDelivery: estimatedDelivery
                }
            }
        });
            
    } catch (error) {
        console.error('❌ Error getting cart products:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get cart products',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Export other functions from the original file
export * from './cart.controller';

/**
 * Clears all items from the user's cart
 * 
 * @async
 * @function clearCart
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const clearCart = async (req, res) => {
    try {
        // Ensure user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        // Find the user and clear their cart
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { cartItems: [] } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            data: {
                cartItems: []
            }
        });
            
    } catch (error) {
        console.error('❌ Error clearing cart:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to clear cart',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export default {
    getCartProducts,
    clearCart
};
