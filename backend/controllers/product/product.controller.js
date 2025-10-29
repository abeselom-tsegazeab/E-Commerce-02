import mongoose from 'mongoose';
import Product from '../../models/product.model.js';
import { 
  clearProductCaches, 
  generateSKU, 
  uploadImages,
  getFeaturedProducts as getFeaturedProductsService,
  searchProducts as searchProductsService,
  getRelatedProducts as getRelatedProductsService,
  getProductCounts as getProductCountsService,
  getProductVariants as getProductVariantsService,
  updateProductInventory as updateProductInventoryService,
  getProductsByIds as getProductsByIdsService
} from './product.services.js';

// Create a new product
export const createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      name,
      description,
      price,
      category,
      images = [],
      variants = [],
      ...rest
    } = req.body;
    
    // Process and upload images
    const uploadedImages = await uploadImages(images);
    
    // Generate SKU
    const sku = await generateSKU(name);
    
    // Create product
    const product = new Product({
      name,
      description,
      price,
      category,
      images: uploadedImages,
      sku,
      variants,
      ...rest
    });
    
    await product.save({ session });
    await session.commitTransaction();
    
    // Clear relevant caches
    await clearProductCaches();
    
    res.status(201).json({
      success: true,
      data: product
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all products with filtering and pagination
export const getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = req.query.sortBy === 'price-lowest' ? 'price' : 
            req.query.sortBy === 'price-highest' ? '-price' : 
            req.query.sortBy === 'name-a' ? 'name' :
            req.query.sortBy === 'name-z' ? '-name' :
            '-createdAt' 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Handle category filter
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Handle price range filter (min and max)
    if (req.query['priceRange[]']) {
      const [min, max] = Array.isArray(req.query['priceRange[]']) 
        ? req.query['priceRange[]'].map(Number) 
        : [req.query.minPrice, req.query.maxPrice].map(Number);
      
      query.price = {};
      if (!isNaN(min)) query.price.$gte = min;
      if (!isNaN(max)) query.price.$lte = max;
    }
    
    // Handle in-stock filter
    if (req.query.inStock === 'true') {
      query['variants.quantity'] = { $gt: 0 };
    } else if (req.query.inStock === 'false') {
      query.$or = [
        { 'variants.quantity': { $lte: 0 } },
        { 'variants.quantity': { $exists: false } }
      ];
    }
    
    // Handle rating filter
    if (req.query.rating && !isNaN(Number(req.query.rating))) {
      const minRating = Number(req.query.rating);
      query.rating = { $gte: minRating };
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
      ...result
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

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id)
      .populate('category', 'name slug');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Handle image updates if any
    if (updateData.images) {
      updateData.images = await uploadImages(updateData.images);
    }
    
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, session }
    );
    
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    await session.commitTransaction();
    
    // Clear relevant caches
    await clearProductCaches(id);
    
    res.status(200).json({
      success: true,
      data: product
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    const product = await Product.findByIdAndDelete(id, { session });
    
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // TODO: Delete associated images from Cloudinary
    
    await session.commitTransaction();
    
    // Clear relevant caches
    await clearProductCaches(id);
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

// Toggle featured status for a product
export const toggleFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    product.isFeatured = !product.isFeatured;
    await product.save();
    
    // Clear featured products cache
    await clearProductCaches(id);
    
    res.status(200).json({
      success: true,
      data: {
        isFeatured: product.isFeatured
      }
    });
    
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling featured status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get featured products
export const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const products = await getFeaturedProductsService(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
    
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const { 
      q, 
      category, 
      minPrice, 
      maxPrice, 
      tags,
      inStock,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const { products, total } = await searchProductsService({
      query: q,
      category,
      minPrice,
      maxPrice,
      tags: tags ? tags.split(',') : undefined,
      inStock,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });
    
    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      data: products
    });
    
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get related products
export const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;
    
    const relatedProducts = await getRelatedProductsService(id, parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: relatedProducts.length,
      data: relatedProducts
    });
    
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching related products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get product counts by status
export const getProductCounts = async (req, res) => {
  try {
    const counts = await getProductCountsService();
    
    res.status(200).json({
      success: true,
      data: counts
    });
    
  } catch (error) {
    console.error('Error fetching product counts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product counts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Bulk update products
export const bulkUpdateProducts = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { ids, updateData } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }
    
    const result = await Product.updateMany(
      { _id: { $in: ids } },
      { $set: updateData },
      { session, new: true }
    );
    
    await session.commitTransaction();
    
    // Clear relevant caches
    await Promise.all(ids.map(id => clearProductCaches(id)));
    
    res.status(200).json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

// Get product variants
export const getProductVariants = async (req, res) => {
  try {
    const { id } = req.params;
    
    const variants = await getProductVariantsService(id);
    
    res.status(200).json({
      success: true,
      data: variants
    });
    
  } catch (error) {
    console.error('Error fetching product variants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product variants',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update product inventory
export const updateProductInventory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { quantity, operation = 'set', variantId } = req.body;
    
    const product = await updateProductInventoryService({
      productId: id,
      quantity: parseInt(quantity),
      operation,
      variantId,
      session
    });
    
    await session.commitTransaction();
    
    // Clear relevant caches
    await clearProductCaches(id);
    
    res.status(200).json({
      success: true,
      data: product
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating inventory',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

// Update product variants
export const updateProductVariants = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { variants } = req.body;

    if (!variants || !Array.isArray(variants)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Variants array is required'
      });
    }

    // Validate variants
    for (const variant of variants) {
      if (!variant.sku || !variant.options || !Array.isArray(variant.options)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Each variant must have a SKU and options array'
        });
      }
    }

    const product = await Product.findById(id).session(session);
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update variants
    product.variants = variants;
    product.hasVariants = variants.length > 0;
    
    // Update main product inventory based on variants
    if (variants.length > 0) {
      product.quantity = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
      
      // Set price range if needed
      const prices = variants.map(v => v.price).filter(Boolean);
      if (prices.length > 0) {
        product.price = Math.min(...prices);
        if (variants.some(v => v.comparePrice)) {
          product.comparePrice = Math.max(...variants.map(v => v.comparePrice || 0));
        }
      }
    }

    await product.save({ session });
    await session.commitTransaction();
    session.endSession();
    
    // Clear cache
    await clearProductCaches(id);

    res.status(200).json({
      success: true,
      message: 'Product variants updated successfully',
      data: product
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error updating product variants:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product variants',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all active categories
export const getAllCategories = async (req, res) => {
  try {
    const Category = mongoose.model('Category');
    
    // Find all active categories
    const categories = await Category.find({
      isActive: true
    })
    .select('name slug description image parent')
    .sort('name')
    .lean();
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get multiple products by IDs
export const getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    
    // This validation is now handled by the middleware, but kept as a safety check
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product ID is required',
        field: 'ids',
        example: { "ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"] }
      });
    }
    
    const products = await getProductsByIdsService(ids);
    
    // If no products found, check if it's because they don't exist or are inactive
    if (products.length === 0) {
      // Check if any of the products exist but are inactive
      const existingProducts = await Product.countDocuments({ 
        _id: { $in: ids } 
      });
      
      if (existingProducts > 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
          message: 'No active products found with the provided IDs',
          foundInactive: true
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'No products found with the provided IDs',
        ids,
        example: { "ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"] }
      });
    }
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
      foundAll: products.length === ids.length,
      missingIds: products.length < ids.length 
        ? ids.filter(id => !products.some(p => p._id.toString() === id))
        : undefined
    });
    
  } catch (error) {
    console.error('Error fetching products by IDs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};