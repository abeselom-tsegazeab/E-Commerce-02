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

import Product from "../models/product.model.js";

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
        const userId = req.user._id;
        
        // Get all product IDs from the user's cart
        const productIds = req.user.cartItems.map(item => item.id);
        
        // Find all products that are in the user's cart and are active
        const products = await Product.find({
            _id: { $in: productIds },
            isDeleted: { $ne: true },
            status: 'active'
        }).select('name price image stock');
        
        // Create a map of product IDs to their details for quick lookup
        const productMap = new Map(
            products.map(product => [product._id.toString(), product])
        );
        
        // Create the cart items with product details and quantities
        const cartItems = req.user.cartItems.reduce((result, cartItem) => {
            const product = productMap.get(cartItem.id);
            
            if (product) {
                result.push({
                    ...product.toObject(),
                    quantity: cartItem.quantity,
                    inStock: product.stock >= cartItem.quantity
                });
            }
            return result;
        }, []);
        
        // Calculate cart summary
        const summary = cartItems.reduce((acc, item) => ({
            totalItems: acc.totalItems + item.quantity,
            subtotal: acc.subtotal + (item.price * item.quantity),
            shipping: 0, // Will be calculated based on business rules
            discount: 0, // Will be calculated based on promotions
            total: 0 // Will be calculated after all adjustments
        }), { totalItems: 0, subtotal: 0 });        
        
        // Apply shipping and discounts (simplified example)
        summary.shipping = summary.subtotal > 0 ? 10.00 : 0; // Example flat rate shipping
        summary.total = summary.subtotal + summary.shipping - summary.discount;
        
        res.json({
            success: true,
            data: {
                items: cartItems,
                summary: {
                    ...summary,
                    currency: 'USD', // Default currency
                    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
                }
            }
        });
        
    } catch (error) {
        console.error('Error in getCartProducts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cart items',
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
        
        // Validate input
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }
        
        // Check if product exists and is available
        const product = await Product.findOne({
            _id: productId,
            isDeleted: { $ne: true },
            status: 'active'
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or not available'
            });
        }
        
        // Check stock availability
        const existingItem = req.user.cartItems.find(item => item.id === productId);
        const newQuantity = (existingItem?.quantity || 0) + parseInt(quantity, 10);
        
        if (newQuantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock',
                availableStock: product.stock
            });
        }
        
        // Update or add cart item
        if (existingItem) {
            existingItem.quantity = newQuantity;
            existingItem.updatedAt = new Date();
        } else {
            req.user.cartItems.push({
                id: productId,
                quantity: parseInt(quantity, 10),
                addedAt: new Date(),
                updatedAt: new Date()
            });
        }
        
        // Save the updated user document
        await req.user.save();
        
        // Get the updated cart item
        const updatedItem = req.user.cartItems.find(item => item.id === productId);
        
        res.status(200).json({
            success: true,
            data: {
                cartItem: updatedItem,
                message: 'Product added to cart'
            }
        });
        
    } catch (error) {
        console.error('Error in addToCart:', error);
        res.status(500).json({
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
export const removeAllFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const { user } = req;
        
        let message;
        let removedProductId;
        
        if (!productId) {
            // Clear the entire cart
            user.cartItems = [];
            message = 'All items removed from cart';
        } else {
            // Remove specific product from cart
            const initialCount = user.cartItems.length;
            user.cartItems = user.cartItems.filter((item) => {
                if (item.id === productId) {
                    removedProductId = productId;
                    return false;
                }
                return true;
            });
            
            if (initialCount === user.cartItems.length) {
                // No items were removed (product not found in cart)
                return res.status(404).json({
                    success: false,
                    message: 'Product not found in cart',
                    productId
                });
            }
            
            message = 'Product removed from cart';
        }
        
        // Save the updated user document
        await user.save();
        
        // Prepare response
        const response = {
            success: true,
            data: {
                message,
                cartItems: user.cartItems
            }
        };
        
        // Add removed product ID to response if applicable
        if (removedProductId) {
            response.data.removedProductId = removedProductId;
        }
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error in removeAllFromCart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cart',
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
export const updateQuantity = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { quantity } = req.body;
        
        // Validate input
        if (typeof quantity === 'undefined' || quantity === null || isNaN(quantity) || quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid quantity is required and must be a non-negative number'
            });
        }
        
        // Find the product in the database to check stock
        const product = await Product.findOne({
            _id: productId,
            isDeleted: { $ne: true },
            status: 'active'
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or not available'
            });
        }
        
        // Check if product is in the user's cart
        const user = req.user;
        const existingItemIndex = user.cartItems.findIndex(item => item.id === productId);
        
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
        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock',
                availableStock: product.stock,
                requestedQuantity: quantity
            });
        }
        
        // Update the quantity
        user.cartItems[existingItemIndex].quantity = quantity;
        user.cartItems[existingItemIndex].updatedAt = new Date();
        await user.save();
        
        // Get the updated cart summary
        const cartSummary = user.cartItems.reduce((acc, item) => {
            const product = user.cartItems.find(p => p.id === item.id);
            if (product) {
                acc.totalItems += item.quantity;
                acc.subtotal += (product.price * item.quantity);
            }
            return acc;
        }, { totalItems: 0, subtotal: 0 });
        
        // Apply shipping and discounts (simplified example)
        cartSummary.shipping = cartSummary.subtotal > 0 ? 10.00 : 0;
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
};
