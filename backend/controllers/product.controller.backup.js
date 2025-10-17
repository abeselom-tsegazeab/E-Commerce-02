import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
import redis from '../lib/redis.js';
import cloudinary from '../lib/cloudinary.js';

// Cache TTL in seconds
const CACHE_TTL = {
  PRODUCT_DETAILS: 3600,    // 1 hour
  PRODUCT_LIST: 1800,       // 30 minutes
  RELATED_PRODUCTS: 1800,   // 30 minutes
  SEARCH_RESULTS: 900       // 15 minutes
};

// Helper function to clear product-related caches
const clearProductCaches = async (productId = null) => {
  const cacheKeys = [
    'featured:products',
    'products:list:*',
    'categories:list',
    'search:products:*',
  ];
  
  if (productId) {
    cacheKeys.push(`product:${productId}`);
    // Get related cache keys for this product
    const relatedKeys = await redis.keys(`related:${productId}:*`);
    if (relatedKeys.length) {
      cacheKeys.push(...relatedKeys);
    }
  }
  
  await Promise.all(cacheKeys.map(key => redis.del(key)));
};

// Helper function to generate SKU
const generateSKU = async (name) => {
  const prefix = name
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, 'X');
  
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${random}`;
};

// Helper function to process and upload images
const uploadImages = async (images = []) => {
  const uploadPromises = images.map(async (img) => {
    if (img.startsWith('data:image')) {
      try {
        const result = await cloudinary.uploader.upload(img, {
          folder: 'ecommerce/products',
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto',
        });
        return {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        };
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        return null;
      }
    }
    // If it's already a URL, return as is
    return { url: img };
  });

  const results = await Promise.all(uploadPromises);
  return results.filter(Boolean);
};

// Helper function to validate product data
const validateProductData = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate || data.name !== undefined) {
    if (!data.name || data.name.trim().length < 2 || data.name.length > 200) {
      errors.push('Product name must be between 2 and 200 characters');
    }
  }
  
  if (!isUpdate || data.description !== undefined) {
    if (!data.description || data.description.trim().length < 10) {
      errors.push('Product description must be at least 10 characters');
    }
  }
  
  if (!isUpdate || data.price !== undefined) {
    if (isNaN(data.price) || data.price < 0) {
      errors.push('Price must be a positive number');
    }
  }
  
  if (data.compareAtPrice && data.compareAtPrice <= data.price) {
    errors.push('Compare at price must be greater than the price');
  }
  
  if (data.quantity !== undefined && (isNaN(data.quantity) || data.quantity < 0)) {
    errors.push('Quantity must be a non-negative number');
  }
  
  if (data.variants && Array.isArray(data.variants)) {
    data.variants.forEach((variant, index) => {
      if (!variant.name || !variant.sku) {
        errors.push(`Variant ${index + 1} must have a name and SKU`);
      }
      if (variant.price === undefined || variant.price < 0) {
        errors.push(`Variant ${index + 1} must have a valid price`);
      }
      if (variant.quantity === undefined || variant.quantity < 0) {
        errors.push(`Variant ${index + 1} must have a valid quantity`);
      }
    });
  }
  
  return errors;
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
export const createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      name,
      description,
      shortDescription,
      price,
      compareAtPrice,
      costPerItem,
      sku,
      barcode,
      trackInventory,
      quantity,
      allowBackorders,
      lowStockThreshold,
      weight,
      dimensions,
      requiresShipping,
      images,
      category,
      subcategories = [],
      brand,
      collections = [],
      tags = [],
      hasVariants = false,
      variantOptions = [],
      variants = [],
      status = 'draft',
      isFeatured = false,
      isBestSeller = false,
      isNewArrival = true,
      seo = {},
      customFields = []
    } = req.body;
    
    // Validate required fields
    const errors = validateProductData({
      name,
      description,
      price,
      variants: hasVariants ? variants : []
    });
    
    if (errors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // Generate SKU if not provided
    const productSKU = sku || await generateSKU(name);
    
    // Process and upload images
    const uploadedImages = await uploadImages(images || []);
    
    // Create product data object
    const productData = {
      name,
      slug: slugify(name, { lower: true, strict: true }),
      description,
      shortDescription: shortDescription || description.substring(0, 160) + '...',
      price,
      compareAtPrice,
      costPerItem,
      sku: productSKU,
      barcode,
      trackInventory: Boolean(trackInventory),
      quantity: trackInventory ? 0 : (quantity || 0),
      allowBackorders: Boolean(allowBackorders),
      lowStockThreshold: lowStockThreshold || 5,
      weight,
      dimensions,
      requiresShipping: requiresShipping !== false,
      images: uploadedImages,
      category,
      subcategories,
      brand,
      collections,
      tags: Array.isArray(tags) ? tags.map(tag => tag.trim().toLowerCase()) : [],
      hasVariants: Boolean(hasVariants),
      variantOptions,
      status,
      isFeatured: Boolean(isFeatured),
      isBestSeller: Boolean(isBestSeller),
      isNewArrival: Boolean(isNewArrival),
      seo: {
        title: seo.title || name,
        description: seo.description || shortDescription || description.substring(0, 155) + '...',
        keywords: seo.keywords || [],
        canonicalUrl: seo.canonicalUrl
      },
      customFields,
      createdBy: req.user._id
    };
    
    // Create the product
    const product = new Product(productData);
    
    // Process variants if any
    if (hasVariants && variants.length > 0) {
      const variantPromises = variants.map(async (variant) => {
        const variantImages = await uploadImages(variant.images || []);
        
        return {
          ...variant,
          sku: variant.sku || await generateSKU(`${name} ${variant.name || ''}`.trim()),
          images: variantImages,
          isDefault: variant.isDefault || false,
          isActive: variant.isActive !== false
        };
      });
      
      product.variants = await Promise.all(variantPromises);
      
      // If no default variant is set, set the first one as default
      if (!product.variants.some(v => v.isDefault) && product.variants.length > 0) {
        product.variants[0].isDefault = true;
      }
    }
    
    // Save the product
    await product.save({ session });
    
    // Update category product count
    await Category.updateMany(
      { _id: { $in: [category, ...subcategories] } },
      { $inc: { productCount: 1 } },
      { session }
    );
    
    // Update brand product count if brand is provided
    if (brand) {
      await Brand.findByIdAndUpdate(
        brand,
        { $inc: { productCount: 1 } },
        { session, new: true }
      );
    }
    
    await session.commitTransaction();
    session.endSession();
    
    // Clear relevant caches
    await clearProductCaches();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
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

/**
 * @desc    Get all products with filtering, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      category,
      brand,
      minPrice,
      maxPrice,
      status,
      featured,
      search,
      tag,
      inStock,
      hasDiscount,
      ids
    } = req.query;
    
    const query = {};
    
    // Filter by category
    if (category) {
      query.$or = [
        { category },
        { subcategories: category }
      ];
    }
    
    // Filter by brand
    if (brand) {
      query.brand = brand;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    } else {
      // Default to only active products if no status is specified
      query.status = 'active';
    }
    
    // Filter by featured status
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // In stock filter
    if (inStock === 'true') {
      query.$or = [
        { quantity: { $gt: 0 } },
        { 'variants.quantity': { $gt: 0 } }
      ];
    }
    
    // Has discount filter
    if (hasDiscount === 'true') {
      query.compareAtPrice = { $gt: 0, $ne: null };
    }
    
    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    // Filter by multiple IDs
    if (ids) {
      const idList = Array.isArray(ids) ? ids : ids.split(',');
      query._id = { $in: idList };
    }
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Execute query with pagination
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'brand', select: 'name slug logo' },
        { path: 'reviews', select: 'rating' }
      ],
      lean: true
    };
    
    const products = await Product.paginate(query, options);
    
    // Calculate average rating for each product
    products.docs = products.docs.map(product => ({
      ...product,
      averageRating: product.reviews && product.reviews.length > 0
        ? product.reviews.reduce((acc, item) => acc + item.rating, 0) / product.reviews.length
        : 0,
      reviewCount: product.reviews ? product.reviews.length : 0
    }));
    
    res.status(200).json({
      success: true,
      ...products
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get a single product by ID or slug
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `product:${id}`;
    
    // Try to get from cache first
    const cachedProduct = await redis.get(cacheKey);
    if (cachedProduct) {
      return res.status(200).json({
        success: true,
        fromCache: true,
        data: JSON.parse(cachedProduct)
      });
    }
    
    // Build query
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { slug: id };
    
    // Find product with related data
    const product = await Product.findOne(query)
      .populate('category', 'name slug')
      .populate('subcategories', 'name slug')
      .populate('brand', 'name slug logo')
      .populate('collections', 'name slug')
      .populate({
        path: 'reviews',
        populate: {
          path: 'user',
          select: 'name avatar'
        },
        options: { sort: { createdAt: -1 } }
      })
      .lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Calculate average rating
    if (product.reviews && product.reviews.length > 0) {
      product.averageRating = parseFloat((product.reviews.reduce((acc, item) => acc + item.rating, 0) / product.reviews.length).toFixed(1));
      product.reviewCount = product.reviews.length;
    } else {
      product.averageRating = 0;
      product.reviewCount = 0;
    }
    
    // Get related products
    const relatedProducts = await Product.find({
      $or: [
        { category: product.category },
        { subcategories: { $in: product.subcategories } },
        { brand: product.brand?._id },
        { tags: { $in: product.tags } }
      ],
      _id: { $ne: product._id },
      status: 'active'
    })
    .select('name slug price compareAtPrice images rating reviewCount')
    .limit(4)
    .lean();
    
    // Add related products to the response
    const result = {
      ...product,
      relatedProducts
    };
    
    // Cache the result
    await redis.setex(cacheKey, CACHE_TTL.PRODUCT_DETAILS, JSON.stringify(result));
    
    res.status(200).json({
      success: true,
      data: result
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

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Find the existing product
    const existingProduct = await Product.findById(id).session(session);
    if (!existingProduct) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Validate the update data
    const errors = validateProductData(updateData, true);
    if (errors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // Handle image updates if any
    if (updateData.images && Array.isArray(updateData.images)) {
      const uploadedImages = await uploadImages(updateData.images);
      updateData.images = [...existingProduct.images, ...uploadedImages];
    }
    
    // Handle variant updates
    if (updateData.hasVariants && updateData.variants) {
      const updatedVariants = await Promise.all(
        updateData.variants.map(async (variant) => {
          if (variant._id) {
            // Update existing variant
            const existingVariant = existingProduct.variants.id(variant._id);
            if (existingVariant) {
              // Handle variant image updates
              if (variant.images && Array.isArray(variant.images)) {
                const uploadedVariantImages = await uploadImages(variant.images);
                variant.images = [...(existingVariant.images || []), ...uploadedVariantImages];
              }
              
              // Update variant fields
              Object.assign(existingVariant, variant);
              return existingVariant;
            }
          }
          
          // Add new variant
          const variantImages = await uploadImages(variant.images || []);
          return {
            ...variant,
            sku: variant.sku || await generateSKU(`${updateData.name || existingProduct.name} ${variant.name || ''}`.trim()),
            images: variantImages,
            isDefault: variant.isDefault || false,
            isActive: variant.isActive !== false
          };
        })
      );
      
      updateData.variants = updatedVariants;
    }
    
    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { new: true, session, runValidators: true }
    );
    
    // If category changed, update category counts
    if (updateData.category && updateData.category.toString() !== existingProduct.category.toString()) {
      await Category.updateMany(
        { _id: { $in: [existingProduct.category, updateData.category] } },
        [
          { $set: { productCount: { $cond: { if: { $eq: ['$_id', existingProduct.category] }, then: { $subtract: ['$productCount', 1] }, else: { $add: ['$productCount', 1] } } } } }
        ],
        { session }
      );
    }
    
    await session.commitTransaction();
    session.endSession();
    
    // Clear relevant caches
    await clearProductCaches(id);
    
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    // Find and delete the product
    const product = await Product.findByIdAndDelete(id).session(session);
    
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Update category and brand counts
    await Promise.all([
      Category.updateMany(
        { _id: { $in: [product.category, ...(product.subcategories || [])] } },
        { $inc: { productCount: -1 } },
        { session }
      ),
      product.brand && Brand.findByIdAndUpdate(
        product.brand,
        { $inc: { productCount: -1 } },
        { session }
      )
    ]);
    
    // Delete images from Cloudinary
    const deletePromises = [];
    
    // Delete main product images
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (img.publicId) {
          deletePromises.push(
            cloudinary.uploader.destroy(img.publicId)
              .catch(err => console.error('Error deleting image from Cloudinary:', err))
          );
        }
      });
    }
    
    // Delete variant images
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(variant => {
        if (variant.images && variant.images.length > 0) {
          variant.images.forEach(img => {
            if (img.publicId) {
              deletePromises.push(
                cloudinary.uploader.destroy(img.publicId)
                  .catch(err => console.error('Error deleting variant image from Cloudinary:', err))
              );
            }
          });
        }
      });
    }
    
    await Promise.all(deletePromises);
    await session.commitTransaction();
    session.endSession();
    
    // Clear relevant caches
    await clearProductCaches(id);
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: { id: product._id }
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Toggle product featured status
 * @route   PATCH /api/products/:id/toggle-featured
 * @access  Private/Admin
 */
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
    product.updatedBy = req.user._id;
    
    await product.save();
    
    // Clear featured products cache
    await redis.del('featured:products');
    
    res.status(200).json({
      success: true,
      message: `Product ${product.isFeatured ? 'added to' : 'removed from'} featured products`,
      data: {
        _id: product._id,
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

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
export const getFeaturedProducts = async (req, res) => {
  try {
    const cacheKey = 'featured:products';
    
    // Try to get from cache first
    const cachedProducts = await redis.get(cacheKey);
    if (cachedProducts) {
      return res.status(200).json({
        success: true,
        fromCache: true,
        data: JSON.parse(cachedProducts)
      });
    }
    
    // Get featured products from database
    const featuredProducts = await Product.find({
      isFeatured: true,
      status: 'active'
    })
    .select('name slug price compareAtPrice images rating reviewCount')
    .sort('-createdAt')
    .limit(10)
    .lean();
    
    // Cache the result
    await redis.setex(cacheKey, CACHE_TTL.FEATURED_PRODUCTS, JSON.stringify(featuredProducts));
    
    res.status(200).json({
      success: true,
      data: featuredProducts
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

/**
 * @desc    Search products
 * @route   GET /api/products/search
 * @access  Public
 */
export const searchProducts = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sort = 'relevance', page = 1, limit = 12 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const cacheKey = `search:${q}:${category || 'all'}:${minPrice || '0'}:${maxPrice || 'inf'}:${sort}:${page}:${limit}`;
    
    // Try to get from cache first
    const cachedResults = await redis.get(cacheKey);
    if (cachedResults) {
      return res.status(200).json({
        success: true,
        fromCache: true,
        data: JSON.parse(cachedResults)
      });
    }
    
    // Build query
    const query = {
      $text: { $search: q },
      status: 'active'
    };
    
    // Add category filter
    if (category) {
      query.$or = [
        { category },
        { subcategories: category }
      ];
    }
    
    // Add price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // Build sort options
    let sortOption = {};
    switch (sort) {
      case 'price-asc':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
        sortOption = { price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'rating':
        sortOption = { averageRating: -1 };
        break;
      default: // relevance
        sortOption = { score: { $meta: 'textScore' } };
    }
    
    // Execute search with pagination
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sortOption,
      select: 'name slug price compareAtPrice images rating reviewCount',
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'brand', select: 'name slug' }
      ],
      lean: true
    };
    
    // If sorting by relevance, add text score to the query
    if (sort === 'relevance') {
      options.select += ' score';
      options.lean = { score: { $meta: 'textScore' } };
    }
    
    const results = await Product.paginate(query, options);
    
    // Cache the results
    await redis.setex(cacheKey, CACHE_TTL.SEARCH_RESULTS, JSON.stringify(results));
    
    res.status(200).json({
      success: true,
      ...results
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

/**
 * @desc    Get related products
 * @route   GET /api/products/:id/related
 * @access  Public
 */
export const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;
    const cacheKey = `related:${id}:${limit}`;
    
    // Try to get from cache first
    const cachedRelated = await redis.get(cacheKey);
    if (cachedRelated) {
      return res.status(200).json({
        success: true,
        fromCache: true,
        data: JSON.parse(cachedRelated)
      });
    }
    
    // Get the product to find related items
    const product = await Product.findById(id)
      .select('category subcategories brand tags')
      .lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Build the query to find related products
    const relatedQuery = {
      _id: { $ne: product._id },
      status: 'active',
      $or: []
    };
    
    // Add conditions based on product properties
    if (product.category) {
      relatedQuery.$or.push({ category: product.category });
    }
    
    if (product.subcategories && product.subcategories.length > 0) {
      relatedQuery.$or.push({ subcategories: { $in: product.subcategories } });
    }
    
    if (product.brand) {
      relatedQuery.$or.push({ brand: product.brand });
    }
    
    if (product.tags && product.tags.length > 0) {
      relatedQuery.$or.push({ tags: { $in: product.tags } });
    }
    
    // If no conditions were added, return empty array
    if (relatedQuery.$or.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get related products
    const relatedProducts = await Product.find(relatedQuery)
      .select('name slug price compareAtPrice images rating reviewCount')
      .limit(parseInt(limit, 10))
      .sort('-createdAt')
      .lean();
    
    // Cache the result
    await redis.setex(cacheKey, CACHE_TTL.RELATED_PRODUCTS, JSON.stringify(relatedProducts));
    
    res.status(200).json({
      success: true,
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

/**
 * @desc    Get product count by status
 * @route   GET /api/products/count
 * @access  Private/Admin
 */
export const getProductCounts = async (req, res) => {
  try {
    const cacheKey = 'products:count';
    
    // Try to get from cache first
    const cachedCounts = await redis.get(cacheKey);
    if (cachedCounts) {
      return res.status(200).json({
        success: true,
        fromCache: true,
        data: JSON.parse(cachedCounts)
      });
    }
    
    // Get counts for each status
    const [active, draft, archived] = await Promise.all([
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'draft' }),
      Product.countDocuments({ status: 'archived' })
    ]);
    
    const counts = {
      active,
      draft,
      archived,
      total: active + draft + archived,
      outOfStock: await Product.countDocuments({
        $or: [
          { quantity: { $lte: 0 } },
          { 'variants.quantity': { $lte: 0 } }
        ],
        status: 'active'
      })
    };
    
    // Cache the result
    await redis.setex(cacheKey, 3600, JSON.stringify(counts)); // Cache for 1 hour
    
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

/**
 * @desc    Bulk update products
 * @route   PATCH /api/products/bulk-update
 * @access  Private/Admin
 */
export const bulkUpdateProducts = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { ids, action, data } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }
    
    let update = {};
    let message = 'Products updated successfully';
    
    switch (action) {
      case 'publish':
        update = { status: 'active' };
        message = 'Products published successfully';
        break;
        
      case 'draft':
        update = { status: 'draft' };
        message = 'Products moved to draft';
        break;
        
      case 'archive':
        update = { status: 'archived' };
        message = 'Products archived successfully';
        break;
        
      case 'feature':
        update = { isFeatured: true };
        message = 'Products marked as featured';
        break;
        
      case 'unfeature':
        update = { isFeatured: false };
        message = 'Products unfeatured';
        break;
        
      case 'update':
        if (!data || typeof data !== 'object') {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: 'Invalid update data'
          });
        }
        update = { ...data };
        break;
        
      default:
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }
    
    // Add updatedBy and updatedAt
    update.updatedBy = req.user._id;
    update.updatedAt = new Date();
    
    // Update the products
    const { modifiedCount } = await Product.updateMany(
      { _id: { $in: ids } },
      { $set: update },
      { session }
    );
    
    await session.commitTransaction();
    session.endSession();
    
    // Clear relevant caches
    await clearProductCaches();
    
    res.status(200).json({
      success: true,
      message,
      data: {
        updatedCount: modifiedCount
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get product variants
 * @route   GET /api/products/:id/variants
 * @access  Public
 */
export const getProductVariants = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id)
      .select('name variants')
      .lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        _id: product._id,
        name: product.name,
        variants: product.variants || []
      }
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

/**
 * @desc    Update product inventory
 * @route   PATCH /api/products/:id/inventory
 * @access  Private/Admin
 */
export const updateProductInventory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { quantity, variantId, operation = 'set', notifyLowStock } = req.body;
    
    if (quantity === undefined || quantity < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }
    
    const update = {};
    let message = 'Inventory updated successfully';
    
    if (variantId) {
      // Update variant inventory
      const product = await Product.findById(id).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      const variant = product.variants.id(variantId);
      if (!variant) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'Variant not found'
        });
      }
      
      // Update quantity based on operation
      if (operation === 'increment') {
        variant.quantity += quantity;
      } else if (operation === 'decrement') {
        variant.quantity = Math.max(0, variant.quantity - quantity);
      } else {
        variant.quantity = quantity;
      }
      
      // Check low stock
      if (notifyLowStock && variant.quantity <= variant.lowStockThreshold) {
        // TODO: Trigger low stock notification
        message += '. Low stock alert triggered';
      }
      
      await product.save({ session });
      
    } else {
      // Update main product inventory
      if (operation === 'increment') {
        update.$inc = { quantity };
      } else if (operation === 'decrement') {
        update.$inc = { quantity: -quantity };
      } else {
        update.quantity = quantity;
      }
      
      // Add low stock check if needed
      if (notifyLowStock) {
        update.$expr = {
          $lte: [
            { $ifNull: ['$quantity', 0] },
            { $ifNull: ['$lowStockThreshold', 5] }
          ]
        };
        
        // This would typically trigger a notification service
        message += '. Low stock alert triggered';
      }
      
      await Product.findByIdAndUpdate(id, update, { session });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    // Clear product cache
    await clearProductCaches(id);
    
    res.status(200).json({
      success: true,
      message
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error updating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating inventory',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get products by IDs
 * @route   POST /api/products/batch
 * @access  Public
 */
export const getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }
    
    // Create a cache key based on the sorted IDs
    const cacheKey = `products:batch:${ids.sort().join(':')}`;
    
    // Try to get from cache first
    const cachedProducts = await redis.get(cacheKey);
    if (cachedProducts) {
      return res.status(200).json({
        success: true,
        fromCache: true,
        data: JSON.parse(cachedProducts)
      });
    }
    
    // Get products from database
    const products = await Product.find({
      _id: { $in: ids },
      status: 'active'
    })
    .select('name slug price compareAtPrice images rating reviewCount')
    .lean();
    
    // Cache the result
    await redis.setex(cacheKey, CACHE_TTL.PRODUCT_LIST, JSON.stringify(products));
    
    res.status(200).json({
      success: true,
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

// Export all controller methods
export default {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleFeaturedProduct,
  getFeaturedProducts,
  searchProducts,
  getRelatedProducts,
  getProductCounts,
  bulkUpdateProducts,
  getProductVariants,
  updateProductInventory,
  getProductsByIds
};