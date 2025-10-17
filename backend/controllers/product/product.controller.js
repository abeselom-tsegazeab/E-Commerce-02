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
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    // Build query
    const query = {};
    if (req.query.category) {
      query.category = req.query.category;
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

// Get multiple products by IDs
export const getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }
    
    const products = await getProductsByIdsService(ids);
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
    
  } catch (error) {
    console.error('Error fetching products by IDs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};