/**
 * @module controllers/product
 * @description 
 * This module contains all product-related controller functions for the e-commerce API.
 * It provides CRUD operations for products, featured products management, and product recommendations.
 * The module integrates with Redis for caching and Cloudinary for image storage.
 * 
 * @requires ../lib/redis - Redis client for caching product data
 * @requires ../lib/cloudinary - Cloudinary service for image upload and management
 * @requires ../models/product.model - Mongoose Product model
 * 
 * @example
 * // Example usage in routes:
 * const { getAllProducts, createProduct } = require('./controllers/product');
 * router.get('/products', getAllProducts);
 * router.post('/products', auth, admin, createProduct);
 */

import  redis  from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";

// Cache TTL constants (in seconds)
const CACHE_TTL = {
    FEATURED_PRODUCTS: 3600, // 1 hour
    PRODUCT_DETAILS: 1800,    // 30 minutes
    CATEGORY_LIST: 86400      // 24 hours
};

/**
 * @async
 * @function getAllProducts
 * @description Retrieves all products from the database with optional filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} [req.query] - Query parameters
 * @param {string} [req.query.category] - Filter products by category
 * @param {number} [req.query.limit] - Maximum number of products to return
 * @param {number} [req.query.page] - Page number for pagination
 * @param {string} [req.query.sort] - Sort field and direction (e.g., 'price,-createdAt')
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response containing products and metadata
 * 
 * @example
 * // GET /api/products
 * // Returns: 
 * // {
 * //   success: true,
 * //   count: 15,
 * //   data: [{...}, ...],
 * //   page: 1,
 * //   totalPages: 2
 * // }
 * 
 * @example
 * // GET /api/products?category=electronics&limit=10&page=1&sort=-price
 * // Returns paginated and filtered products
 */
const getAllProducts = async (req, res) => {
    try {
        const { category, limit = 10, page = 1, sort = '-createdAt' } = req.query;
        
        // Build query
        const query = {};
        if (category) {
            query.category = category;
        }
        
        // Execute query with pagination
        const options = {
            page: parseInt(page, 10),
            limit: Math.min(parseInt(limit, 10), 100), // Cap at 100 items per page
            sort: sort.split(',').join(' '), // Convert 'field1,field2' to 'field1 field2'
            lean: true
        };
        
        const result = await Product.paginate(query, options);
        
        res.status(200).json({
            success: true,
            count: result.docs.length,
            total: result.totalDocs,
            page: result.page,
            totalPages: result.totalPages,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage,
            data: result.docs
        });
    } catch (error) {
        console.error('Error in getAllProducts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @async
 * @function getFeaturedProducts
 * @description Retrieves featured products with Redis caching layer for improved performance.
 *              First checks Redis cache, if not found, fetches from database and caches the result.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response containing featured products
 * 
 * @example
 * // GET /api/products/featured
 * // Returns: 
 * // {
 * //   success: true,
 * //   fromCache: true,
 * //   data: [
 * //     { _id: '...', name: 'Product 1', ... },
 * //     { _id: '...', name: 'Product 2', ... }
 * //   ]
 * // }
 * 
 * @error 500 - Internal server error if there's a problem fetching featured products
 * @error 404 - No featured products found in the database
 */
const getFeaturedProducts = async (req, res) => {
    const CACHE_KEY = 'featured_products';
    
    try {
        // Try to get from Redis cache first
        let featuredProducts = await redis.get(CACHE_KEY);
        
        if (featuredProducts) {
            return res.status(200).json({
                success: true,
                fromCache: true,
                data: JSON.parse(featuredProducts),
                cachedAt: new Date().toISOString()
            });
        }

        // If not in cache, fetch from database
        featuredProducts = await Product.find({ 
            isFeatured: true,
            isActive: true,
            stock: { $gt: 0 } // Only include in-stock items
        })
        .sort({ updatedAt: -1 }) // Most recently updated first
        .limit(12) // Limit to 12 featured products
        .lean();

        if (!featuredProducts || featuredProducts.length === 0) {
            // Cache empty result to prevent repeated database queries
            await redis.setEx(CACHE_KEY, 300, JSON.stringify([])); // 5 min TTL for empty results
            
            return res.status(404).json({
                success: false,
                message: 'No featured products found',
                data: []
            });
        }

        // Cache the result for future requests
        await redis.setEx(
            CACHE_KEY, 
            CACHE_TTL.FEATURED_PRODUCTS, 
            JSON.stringify(featuredProducts)
        );

        res.status(200).json({
            success: true,
            fromCache: false,
            data: featuredProducts,
            cachedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in getFeaturedProducts:', error);
        
        // In case of error, try to serve from database directly (bypass cache)
        try {
            const fallbackProducts = await Product.find({ isFeatured: true })
                .limit(8)
                .lean();
                
            if (fallbackProducts && fallbackProducts.length > 0) {
                return res.status(200).json({
                    success: true,
                    fromCache: false,
                    data: fallbackProducts,
                    isFallback: true
                });
            }
        } catch (fallbackError) {
            console.error('Fallback query failed:', fallbackError);
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch featured products',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @async
 * @function createProduct
 * @description Creates a new product with optional image upload to Cloudinary.
 * Validates input, handles image upload, and saves the product to the database.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing product details
 * @param {string} req.body.name - Product name (required, 2-100 characters)
 * @param {string} req.body.description - Product description (required, 10-2000 characters)
 * @param {number} req.body.price - Product price (required, positive number)
 * @param {string} [req.body.image] - Base64 encoded image string (optional)
 * @param {string} req.body.category - Product category (required)
 * @param {number} [req.body.stock=0] - Available stock quantity (non-negative integer)
 * @param {boolean} [req.body.isFeatured=false] - Whether product is featured
 * @param {Object} res - Express response object
 * 
 * @returns {Promise<Object>} JSON response with created product or error message
 * @property {boolean} success - Indicates if the operation was successful
 * @property {string} message - Human-readable message
 * @property {Object} [data] - The created product object
 * @property {string} [error] - Error details (in development mode)
 * 
 * @throws {400} If required fields are missing or invalid
 * @throws {500} If there's a server error during product creation
 * 
 * @example
 * // POST /api/products
 * // Request body: 
 * // {
 * //   "name": "Wireless Headphones",
 * //   "description": "High-quality wireless headphones with noise cancellation",
 * //   "price": 199.99,
 * //   "category": "Electronics",
 * //   "stock": 50,
 * //   "isFeatured": true,
 * //   "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
 * // }
 * // 
 * // Response (201 Created):
 * // {
 * //   "success": true,
 * //   "message": "Product created successfully",
 * //   "data": {
 * //     "_id": "60a1b2c3d4e5f6a1b2c3d4e5",
 * //     "name": "Wireless Headphones",
 * //     "description": "High-quality wireless headphones with noise cancellation",
 * //     "price": 199.99,
 * //     "category": "Electronics",
 * //     "stock": 50,
 * //     "isFeatured": true,
 * //     "image": "https://res.cloudinary.com/.../headphones.jpg",
 * //     "createdAt": "2023-01-15T10:30:00.000Z",
 * //     "updatedAt": "2023-01-15T10:30:00.000Z"
 * //   }
 * // }
 */
const createProduct = async (req, res) => {
    try {
        const { 
            name, 
            description, 
            price, 
            image, 
            category, 
            stock = 0, 
            isFeatured = false 
        } = req.body;

        // Input validation
        const errors = [];
        
        if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
            errors.push('Name is required and must be between 2-100 characters');
        }
        
        if (!description || typeof description !== 'string' || description.trim().length < 10 || description.length > 2000) {
            errors.push('Description is required and must be between 10-2000 characters');
        }
        
        if (typeof price !== 'number' || isNaN(price) || price <= 0) {
            errors.push('Price is required and must be a positive number');
        }
        
        if (!category || typeof category !== 'string' || category.trim().length < 2) {
            errors.push('Category is required');
        }
        
        if (stock !== undefined && (isNaN(parseInt(stock)) || stock < 0)) {
            errors.push('Stock must be a non-negative integer');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        let imageUrl = '';
        let cloudinaryId = '';

        // Upload image to Cloudinary if provided
        if (image) {
            try {
                // Validate image size (max 5MB)
                const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                const imageSize = Buffer.byteLength(image, 'base64');
                
                if (imageSize > maxSize) {
                    return res.status(400).json({
                        success: false,
                        message: 'Image size exceeds maximum limit of 5MB'
                    });
                }

                const result = await cloudinary.uploader.upload(image, { 
                    folder: "products",
                    resource_type: "auto",
                    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                    transformation: [
                        { width: 800, height: 800, crop: 'limit', quality: 'auto' },
                        { fetch_format: 'auto' }
                    ]
                });
                
                imageUrl = result.secure_url;
                cloudinaryId = result.public_id;
            } catch (uploadError) {
                console.error('Error uploading image to Cloudinary:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to process product image',
                    error: process.env.NODE_ENV === 'development' ? uploadError.message : undefined
                });
            }
        }

        // Create new product with trimmed strings and proper types
        const newProduct = new Product({
            name: name.trim(),
            description: description.trim(),
            price: parseFloat(price).toFixed(2),
            image: imageUrl,
            cloudinaryId: cloudinaryId || undefined,
            category: category.trim(),
            stock: parseInt(stock, 10) || 0,
            isFeatured: Boolean(isFeatured),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const savedProduct = await newProduct.save();

        // Invalidate relevant caches
        await Promise.all([
            redis.del('featured_products'),
            redis.del(`category_${category.toLowerCase()}`)
        ]);

        // Prepare response data (exclude sensitive/irrelevant fields)
        const { __v, ...productData } = savedProduct.toObject();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: productData
        });

    } catch (error) {
        console.error('Error in createProduct:', error);
        
        // Handle duplicate key error (e.g., unique name violation)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'A product with this name already exists',
                field: 'name'
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to create product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @async
 * @function deleteProduct
 * @description Permanently deletes a product by ID, including its associated image from Cloudinary.
 * Also handles cache invalidation for affected data.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Product ID to delete (MongoDB ObjectId)
 * @param {Object} res - Express response object
 * 
 * @returns {Promise<Object>} JSON response indicating success or failure
 * @property {boolean} success - Indicates if the operation was successful
 * @property {string} message - Human-readable message
 * @property {string} [deletedProductId] - ID of the deleted product (on success)
 * @property {string} [error] - Error details (in development mode)
 * 
 * @throws {400} If product ID is missing or invalid
 * @throws {404} If product with the specified ID is not found
 * @throws {500} If there's a server error during deletion
 * 
 * @example
 * // DELETE /api/products/60a1b2c3d4e5f6a1b2c3d4e5
 * // Response (200 OK):
 * // {
 * //   "success": true,
 * //   "message": "Product deleted successfully",
 * //   "deletedProductId": "60a1b2c3d4e5f6a1b2c3d4e5"
 * // }
 * 
 * @example
 * // Response (404 Not Found):
 * // {
 * //   "success": false,
 * //   "message": "Product not found"
 * // }
 */
const deleteProduct = async (req, res) => {
    const { id } = req.params;

    // Validate product ID format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'A valid product ID is required',
            field: 'id'
        });
    }

    try {
        // Find the product first to get the Cloudinary ID
        const product = await Product.findById(id).select('cloudinaryId category isFeatured');
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
                productId: id
            });
        }

        // Prepare cache keys to invalidate
        const cacheKeysToDelete = [
            'featured_products',
            `product_${id}`,
            `category_${product.category?.toLowerCase()}`
        ].filter(Boolean);

        // Delete image from Cloudinary if it exists
        if (product.cloudinaryId) {
            try {
                await cloudinary.uploader.destroy(product.cloudinaryId, {
                    invalidate: true
                });
            } catch (uploadError) {
                console.error('Error deleting image from Cloudinary:', uploadError);
                // Continue with product deletion even if image deletion fails
            }
        }

        // Delete the product from the database
        const result = await Product.findByIdAndDelete(id);

        if (!result) {
            // This should theoretically never happen due to the earlier check, but just in case
            return res.status(404).json({
                success: false,
                message: 'Product could not be deleted or was already removed',
                productId: id
            });
        }

        // Invalidate relevant caches in parallel
        await Promise.all(cacheKeysToDelete.map(key => redis.del(key)));

        // Log the deletion (in a real app, you might want to log this to a proper logging system)
        console.log(`Product ${id} was deleted`);

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
            deletedProductId: id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in deleteProduct:', error);
        
        // Handle specific error cases
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
                field: 'id'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            productId: id
        });
    }
};

/**
 * @async
 * @function getRecommendedProducts
 * @description Retrieves a list of recommended products based on the specified category,
 *              excluding a specific product if excludeId is provided. Implements caching
 *              for improved performance and includes fallback mechanisms.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.category - Category to get recommendations for (required)
 * @param {string} [req.query.excludeId] - Product ID to exclude from results (optional)
 * @param {number} [req.query.limit=4] - Maximum number of recommendations to return (1-10)
 * @param {Object} res - Express response object
 * 
 * @returns {Promise<Object>} JSON response with recommended products
 * @property {boolean} success - Indicates if the operation was successful
 * @property {number} count - Number of recommended products returned
 * @property {Array} data - Array of recommended products
 * @property {boolean} [fromCache] - Indicates if the results were served from cache
 * @property {string} [error] - Error details (in development mode)
 * 
 * @throws {400} If required parameters are missing or invalid
 * @throws {404} If no recommendations are found for the category
 * @throws {500} If there's a server error
 * 
 * @example
 * // GET /api/products/recommended?category=electronics&excludeId=60a1b2c3d4e5f6a1b2c3d4e5&limit=4
 * // Response (200 OK):
 * // {
 * //   "success": true,
 * //   "count": 4,
 * //   "fromCache": false,
 * //   "data": [
 * //     { product: 'Product 1' },
 * //     { product: 'Product 2' },
 * //     // ... up to 4 products
 * //   ]
 * // }
 * 
 * @example
 * // Response (404 Not Found):
 * // {
 * //   "success": false,
 * //   "message": "No recommended products found in this category",
 * //   "category": "electronics"
 * // }
 */
const getRecommendedProducts = async (req, res) => {
    // Validate required parameters
    const { category, excludeId, limit = '4' } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 4, 1), 10); // Clamp between 1-10
    
    // Input validation
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'A valid category is required',
            field: 'category'
        });
    }

    // Validate excludeId format if provided
    if (excludeId && !/^[0-9a-fA-F]{24}$/.test(excludeId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid product ID format',
            field: 'excludeId'
        });
    }

    // Create a cache key based on the query parameters
    const cacheKey = `recommendations:${category.toLowerCase()}:${excludeId || 'all'}:${parsedLimit}`;
    
    try {
        // Try to get recommendations from cache first
        const cachedRecommendations = await redis.get(cacheKey);
        
        if (cachedRecommendations) {
            const recommendations = JSON.parse(cachedRecommendations);
            return res.status(200).json({
                success: true,
                count: recommendations.length,
                fromCache: true,
                data: recommendations,
                cachedAt: new Date().toISOString()
            });
        }

        // Build the query
        const query = { 
            category: { $regex: new RegExp(`^${category}$`, 'i') }, // Case-insensitive match
            stock: { $gt: 0 }, // Only include in-stock items
            isActive: true // Only include active products
        };
        
        // Exclude the specified product if provided
        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        // Get recommendations from the database
        const recommendedProducts = await Product.find(query)
            .select('-__v -cloudinaryId -reviews') // Exclude unnecessary fields
            .sort({ 
                isFeatured: -1,    // Featured products first
                rating: -1,        // Then by rating (highest first)
                salesCount: -1,    // Then by popularity
                createdAt: -1      // Then by newest
            })
            .limit(parsedLimit)
            .lean();

        // If no recommendations found, try to get products from the same category
        // without considering the excludeId as a fallback
        if (recommendedProducts.length === 0 && excludeId) {
            delete query._id; // Remove the excludeId filter
            const fallbackProducts = await Product.find(query)
                .select('-__v -cloudinaryId -reviews')
                .sort({ rating: -1, salesCount: -1, createdAt: -1 })
                .limit(parsedLimit)
                .lean();
                
            if (fallbackProducts.length > 0) {
                // Cache the fallback results
                await redis.setex(
                    cacheKey,
                    CACHE_TTL.RECOMMENDATIONS, // 30 minutes
                    JSON.stringify(fallbackProducts)
                );
                
                return res.status(200).json({
                    success: true,
                    count: fallbackProducts.length,
                    fromCache: false,
                    isFallback: true,
                    data: fallbackProducts
                });
            }
        }

        // If still no products found, return 404
        if (recommendedProducts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No recommended products found in this category',
                category: category
            });
        }

        // Cache the results for future requests
        await redis.setex(
            cacheKey,
            CACHE_TTL.RECOMMENDATIONS, // 30 minutes
            JSON.stringify(recommendedProducts)
        );

        res.status(200).json({
            success: true,
            count: recommendedProducts.length,
            fromCache: false,
            data: recommendedProducts
        });

    } catch (error) {
        console.error('Error in getRecommendedProducts:', error);
        
        // Try to serve from a fallback category if available
        try {
            const fallbackProducts = await Product.find({ 
                isActive: true,
                stock: { $gt: 0 },
                _id: { $ne: excludeId || null }
            })
            .select('-__v -cloudinaryId -reviews')
            .sort({ isFeatured: -1, rating: -1 })
            .limit(parsedLimit)
            .lean();
            
            if (fallbackProducts.length > 0) {
                return res.status(200).json({
                    success: true,
                    count: fallbackProducts.length,
                    isFallback: true,
                    data: fallbackProducts
                });
            }
        } catch (fallbackError) {
            console.error('Fallback recommendation query failed:', fallbackError);
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to get recommended products',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            category: category
        });
    }
};

/**
 * @async
 * @function getProductsByCategory
 * @description Gets paginated list of products by category
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.category - Category to filter by
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=10] - Number of items per page
 * @param {string} [req.query.sort='-createdAt'] - Sort field and direction
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Paginated list of products in the category
 * @example
 * // GET /api/products/category/electronics?page=1&limit=10
 * // Returns: { success: true, docs: [...], total: 25, limit: 10, ... }
 */
const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

        const query = { category };
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort,
            lean: true
        };

        const products = await Product.paginate(query, options);

        res.status(200).json({
            success: true,
            ...products
        });

    } catch (error) {
        console.error('Error in getProductsByCategory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products by category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @async
 * @function toggleFeaturedProduct
 * @description Toggles the featured status of a product
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Product ID to toggle
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with updated product or error message
 * @throws {Error} If product not found or update fails
 * @example
 * // PATCH /api/products/:id/toggle-featured
 * // Returns: { success: true, message: 'Product added to featured products', data: { ... } }
 */
const toggleFeaturedProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Toggle the isFeatured status
        product.isFeatured = !product.isFeatured;
        await product.save();

        // Invalidate featured products cache
        await redis.del('featured_products');

        res.status(200).json({
            success: true,
            message: `Product ${product.isFeatured ? 'added to' : 'removed from'} featured products`,
            data: product
        });

    } catch (error) {
        console.error('Error in toggleFeaturedProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update featured status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @async
 * @function updateFeaturedProductsCache
 * @description Updates the Redis cache with current featured products
 * @returns {Promise<Array>} Array of featured products
 * @description This function is typically called by a scheduled job to keep the cache fresh
 * @example
 * // Called by cron job
 * await updateFeaturedProductsCache();
 */
const updateFeaturedProductsCache = async () => {
    try {
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        if (featuredProducts && featuredProducts.length > 0) {
            await redis.setEx('featured_products', 3600, JSON.stringify(featuredProducts));
        }
        return featuredProducts;
    } catch (error) {
        console.error('Error updating featured products cache:', error);
        throw error;
    }
};

export {
    getAllProducts,
    getFeaturedProducts,
    createProduct,
    deleteProduct,
    getRecommendedProducts,
    getProductsByCategory,
    toggleFeaturedProduct,
    updateFeaturedProductsCache
};
