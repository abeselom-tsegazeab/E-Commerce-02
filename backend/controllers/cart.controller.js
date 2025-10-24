/**
 * Cart Controller
 * 
 * This module handles all cart-related operations including adding/removing items,
 * updating quantities, and retrieving cart contents. It works with the user's cart
 * stored in their user document and ensures data consistency.
 * 
 * @module controllers/cart
 * @requires ../models/product.model
 * @requires ../models/user.model
 */

import mongoose from 'mongoose';
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

/**
 * @typedef {Object} CartItem
 * @property {string} id - The product ID
 * @property {number} quantity - The quantity of the product in the cart
 * 
 * @typedef {Object} CartProduct
 * @property {string} _id - Product ID
 * @property {string} name - Product name
 * @property {number} price - Product price
 * @property {string} image - Product image URL
 * @property {number} quantity - Quantity in cart
 * @property {number} stock - Available stock
 * @property {boolean} inStock - Whether the product is in stock
 */

/**
 * Retrieves all products in the authenticated user's cart with their details.
 * This function populates the cart items with full product information
 * from the products collection.
 * 
 * @async
 * @function getCartProducts
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {CartItem[]} req.user.cartItems - Array of items in the user's cart
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} If database operations fail
 * @example
 * // GET /api/cart
 * // Response: 200 OK
 * [
 *   {
 *     _id: "507f1f77bcf86cd799439011",
 *     name: "Product Name",
 *     price: 99.99,
 *     image: "/images/product.jpg",
 *     quantity: 2,
 *     stock: 10,
 *     inStock: true
 *   }
 * ]
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

/**
 * Adds a product to the user's cart or updates its quantity if already present.
 * Validates product existence and available stock before adding to cart.
 * 
 * @async
 * @function addToCart
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.productId - ID of the product to add to cart
 * @param {number} [req.body.quantity=1] - Quantity to add (defaults to 1)
 * @param {Object} req.user - Authenticated user object
 * @param {CartItem[]} req.user.cartItems - Array of items in the user's cart
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {400} If product ID is missing or invalid
 * @throws {404} If product is not found or not available
 * @throws {400} If requested quantity exceeds available stock
 * @example
 * // POST /api/cart/add
 * // Request body: { "productId": "507f1f77bcf86cd799439011", "quantity": 2 }
 * // Response: 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "cartItem": {
 *       "id": "507f1f77bcf86cd799439011",
 *       "quantity": 2,
 *       "addedAt": "2023-10-02T11:09:37.000Z"
 *     },
 *     "message": "Product added to cart"
 *   }
 * }
 */
export const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        
        // Input validation
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        // Ensure user is authenticated and get fresh user document
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        // Get the user document with cartItems
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Initialize cartItems array if it doesn't exist
        if (!user.cartItems) {
            user.cartItems = [];
        }
        
        // Find the product with detailed query
        const product = await Product.findOne({
            _id: productId,
            isDeleted: { $ne: true },
            isActive: true
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or not available'
            });
        }

        // Check stock
        const availableStock = product.inventory?.quantity ?? product.quantity ?? 0;
        if (availableStock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock',
                availableStock,
                requiredQuantity: quantity
            });
        }

        // Check if product already in cart
        const existingItemIndex = user.cartItems.findIndex(
            item => item && item.product && item.product.toString() === productId
        );

        // Update or add cart item
        if (existingItemIndex === -1) {
            user.cartItems.push({ 
                product: productId, 
                quantity: parseInt(quantity, 10) 
            });
        } else {
            user.cartItems[existingItemIndex].quantity += parseInt(quantity, 10);
        }
        
        // Mark the cartItems array as modified
        user.markModified('cartItems');

        // Save the updated user
        const updatedUser = await user.save();
        
        // Populate the product details for the response
        const populatedUser = await User.findById(updatedUser._id)
            .populate({
                path: 'cartItems.product',
                select: 'name price images stock inventory quantity isActive'
            });
        
        // Format the response
        const cartItems = (populatedUser.cartItems || [])
            .filter(item => item && item.product)
            .map(item => {
                const product = item.product;
                const itemQuantity = item.quantity || 1;
                const availableStock = 
                    (product.inventory?.quantity !== undefined) 
                    ? product.inventory.quantity 
                    : (product.quantity !== undefined ? product.quantity : 0);
                
                const inStock = availableStock >= itemQuantity;
                
                return {
                    ...product.toObject(),
                    quantity: itemQuantity,
                    inStock,
                    cartItemId: item._id || item.id,
                    availableStock,
                    primaryImage: (product.images?.[0]?.url) || ''
                };
            });
        
        // Calculate cart summary
        const summary = cartItems.reduce((acc, item) => ({
            totalItems: acc.totalItems + (item.quantity || 0),
            subtotal: acc.subtotal + ((item.price || 0) * (item.quantity || 0)),
            shipping: 0,
            discount: 0,
            total: 0,
            currency: 'USD'
        }), { totalItems: 0, subtotal: 0 });
        
        // Apply shipping
        summary.shipping = summary.subtotal > 50 ? 0 : 10;
        summary.total = summary.subtotal + summary.shipping - summary.discount;

        return res.status(200).json({
            success: true,
            message: 'Product added to cart',
            data: {
                items: cartItems,
                summary
            }
        });
        
    } catch (error) {
        console.error('❌ Error in addToCart:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add product to cart',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Removes items from the user's cart. If no productId is provided, clears the entire cart.
 * If a productId is provided, removes only that specific product from the cart.
 * 
 * @async
 * @function removeAllFromCart
 * @param {Object} req - Express request object
 * @param {Object} [req.body] - Request body (optional)
 * @param {string} [req.body.productId] - ID of the product to remove (if not provided, clears entire cart)
 * @param {Object} req.user - Authenticated user object
 * @param {MongooseDocument} req.user - Mongoose user document
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {500} If there's a server error during the operation
 * @example
 * // DELETE /api/cart (clear entire cart)
 * // Response: 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "message": "All items removed from cart",
 *     "cartItems": []
 *   }
 * }
 * 
 * // DELETE /api/cart (remove specific product)
 * // Request body: { "productId": "507f1f77bcf86cd799439011" }
 * // Response: 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Product removed from cart",
 *     "removedProductId": "507f1f77bcf86cd799439011",
 *     "cartItems": [] // Array of remaining cart items
 *   }
 * }
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

/**
 * Updates the quantity of a specific product in the user's cart.
 * If quantity is set to 0, the item is removed from the cart.
 * Validates the requested quantity against available stock.
 * 
 * @async
 * @function updateQuantity
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - The ID of the product to update
 * @param {Object} req.body - Request body
 * @param {number} req.body.quantity - The new quantity (must be >= 0)
 * @param {Object} req.user - Authenticated user object
 * @param {CartItem[]} req.user.cartItems - Array of items in the user's cart
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {400} If quantity is invalid or missing
 * @throws {404} If product is not found in cart
 * @throws {400} If requested quantity exceeds available stock
 * @throws {500} If server error occurs
 * @example
 * // PATCH /api/cart/507f1f77bcf86cd799439011
 * // Request body: { "quantity": 3 }
 * // Response: 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Quantity updated successfully",
 *     "cartItem": {
 *       "id": "507f1f77bcf86cd799439011",
 *       "quantity": 3,
 *       "updatedAt": "2023-10-02T11:12:13.000Z"
 *     },
 *     "cartSummary": {
 *       "totalItems": 5,
 *       "subtotal": 299.97,
 *       "shipping": 10.00,
 *       "discount": 0,
 *       "total": 309.97,
 *       "currency": "USD"
 *     }
 *   }
 * }
 */
/**
 * Remove a specific item from the cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success/error message
 */
export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Initialize cartItems if it doesn't exist
        user.cartItems = user.cartItems || [];
        
        // Find and remove the item
        const initialLength = user.cartItems.length;
        user.cartItems = user.cartItems.filter(
            item => item && item.product && item.product.toString() !== productId
        );
        
        if (user.cartItems.length === initialLength) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in cart',
                productId
            });
        }
        
        await user.save();
        
        // Get the updated user with populated cart items
        const updatedUser = await User.findById(user._id)
            .populate('cartItems.product', 'name price images stock');
        
        // Calculate cart summary
        const cartSummary = (updatedUser.cartItems || []).reduce((acc, item) => {
            if (item && item.product) {
                const product = item.product;
                const itemPrice = product.price || 0;
                const itemQuantity = item.quantity || 0;
                
                return {
                    subtotal: (acc.subtotal || 0) + (itemPrice * itemQuantity),
                    totalItems: (acc.totalItems || 0) + itemQuantity
                };
            }
            return acc;
        }, { subtotal: 0, totalItems: 0 });
        
        res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            data: {
                cartSummary: {
                    ...cartSummary,
                    shipping: 0, // Add shipping calculation if needed
                    discount: 0, // Add discount calculation if needed
                    total: (cartSummary.subtotal || 0), // Add shipping and subtract discount if needed
                    currency: 'USD'
                },
                cartItems: updatedUser.cartItems || []
            }
        });
        
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from cart',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update the quantity of a product in the cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated cart
 */
export const updateQuantity = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { quantity } = req.body;
        
        // Validate input - allow 0 for removing items
        if (typeof quantity === 'undefined' || quantity === null || isNaN(quantity) || quantity < 0 || quantity % 1 !== 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid quantity is required and must be a non-negative integer'
            });
        }
        
        // Find the product in the database to check stock
        const product = await Product.findOne({
            _id: productId,
            isDeleted: { $ne: true },
            isActive: true
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or not available'
            });
        }
        
        // Get the user document from the database
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Initialize cartItems if it doesn't exist
        user.cartItems = user.cartItems || [];
        
        // Find the cart item
        const existingItemIndex = user.cartItems.findIndex(
            item => item && item.product && item.product.toString() === productId
        );
        
        if (existingItemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in cart',
                productId
            });
        }
        
        // Handle quantity update or removal
        if (quantity === 0) {
            // Remove item if quantity is 0
            user.cartItems.splice(existingItemIndex, 1);
            await user.save();
            
            return res.status(200).json({
                success: true,
                data: {
                    message: 'Item removed from cart',
                    removedProductId: productId,
                    cartItems: user.cartItems
                }
            });
        }
        
        // Check stock availability for the requested quantity
        const availableStock = product.inventory?.quantity ?? 0;
        if (quantity > availableStock) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock',
                availableStock: availableStock,
                requestedQuantity: quantity
            });
        }
        
        // Update the quantity or remove if quantity is 0
        if (existingItemIndex !== -1) {
            if (quantity === 0) {
                // Remove item from cart if quantity is 0
                user.cartItems.splice(existingItemIndex, 1);
            } else {
                // Update quantity if greater than 0
                user.cartItems[existingItemIndex].quantity = quantity;
                user.cartItems[existingItemIndex].updatedAt = new Date();
            }
            await user.save();
        } else {
            return res.status(404).json({
                success: false,
                message: 'Product not found in cart',
                productId
            });
        }
        
        // Get the updated user with populated cart items
        const updatedUser = await User.findById(user._id)
            .populate('cartItems.product', 'name price images stock');
        
        // Calculate cart summary
        const cartSummary = (updatedUser.cartItems || []).reduce((acc, item) => {
            if (item && item.product) {
                const product = item.product;
                const itemPrice = product.price || 0;
                const itemQuantity = item.quantity || 0;
                
                acc.totalItems += itemQuantity;
                acc.subtotal += (itemPrice * itemQuantity);
            }
            return acc;
        }, { totalItems: 0, subtotal: 0 });
        
        // Apply shipping and discounts
        cartSummary.shipping = cartSummary.subtotal > 50 ? 0 : 10;
        cartSummary.discount = 0; // Could be calculated based on promotions
        cartSummary.total = cartSummary.subtotal + cartSummary.shipping - cartSummary.discount;
        cartSummary.currency = 'USD';
        
        res.status(200).json({
            success: true,
            data: {
                message: 'Quantity updated successfully',
                cartItem: user.cartItems[existingItemIndex],
                cartSummary
            }
        });
        
    } catch (error) {
        console.error('Error in updateQuantity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cart quantity',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
