import Product from '../../models/product.model.js';
import Category from '../../models/category.model.js';
import Brand from '../../models/brand.model.js';
import redis from '../../lib/redis.js';
import cloudinary from '../../lib/cloudinary.js';
import slugify from 'slugify';

// Cache TTL in seconds
const CACHE_TTL = {
  PRODUCT_DETAILS: 3600,    // 1 hour
  PRODUCT_LIST: 1800,       // 30 minutes
  RELATED_PRODUCTS: 1800,   // 30 minutes
  SEARCH_RESULTS: 900,      // 15 minutes
  FEATURED_PRODUCTS: 3600   // 1 hour
};

// Helper function to clear product-related caches
export const clearProductCaches = async (productId = null) => {
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

// Generate SKU for products
export const generateSKU = async (name) => {
  const prefix = name
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, 'X');
  
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${random}`;
};

// Upload images to Cloudinary
export const uploadImages = async (images = []) => {
  const uploadPromises = images.map(async (img) => {
    // Handle both string URLs and object formats
    let imageUrl;
    let altText = '';

    if (typeof img === 'string') {
      imageUrl = img;
    } else if (typeof img === 'object' && img !== null) {
      imageUrl = img.url || img.src || img.imageUrl;
      altText = img.altText || img.alt || '';
    } else {
      return null;
    }

    if (!imageUrl) return null;

    if (typeof imageUrl === 'string' && imageUrl.startsWith('data:image')) {
      try {
        const result = await cloudinary.uploader.upload(imageUrl, {
          folder: 'ecommerce/products',
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto',
        });
        return {
          url: result.secure_url,
          publicId: result.public_id,
          altText: altText || 'Product image',
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
    
    // If it's already a URL, return as an object
    return {
      url: imageUrl,
      altText: altText || 'Product image'
    };
  });

  const results = await Promise.all(uploadPromises);
  return results.filter(Boolean);
};

// Get featured products
const getFeaturedProductsFromDB = async (limit = 10) => {
  const cacheKey = 'featured:products';
  
  // Try to get from cache first
  const cachedProducts = await redis.get(cacheKey);
  if (cachedProducts) {
    return JSON.parse(cachedProducts);
  }
  
  // Get from database
  const products = await Product.find({
    isFeatured: true,
    status: 'active'
  })
  .sort('-createdAt')
  .limit(limit)
  .lean();
  
  // Cache the results
  await redis.setex(cacheKey, CACHE_TTL.FEATURED_PRODUCTS, JSON.stringify(products));
  
  return products;
};

// Search products with filters
const searchProductsInDB = async ({ 
  query, 
  category, 
  minPrice, 
  maxPrice, 
  tags,
  inStock,
  page = 1, 
  limit = 10 
}) => {
  const searchQuery = { isActive: true }; // Changed from status to isActive
  
  // Text search (case-insensitive regex)
  if (query) {
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { sku: { $regex: `^${query}$`, $options: 'i' } }
    ];
  }
  
  // Category filter (handle ObjectId)
  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      searchQuery.category = new mongoose.Types.ObjectId(category);
    }
  }
  
  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    searchQuery.price = {};
    if (minPrice !== undefined) searchQuery.price.$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) searchQuery.price.$lte = parseFloat(maxPrice);
  }
  
  // Tags filter
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    searchQuery.tags = { $in: tagArray.map(tag => new RegExp(tag, 'i')) };
  }
  
  // In stock filter
  if (inStock === 'true') {
    searchQuery.quantity = { $gt: 0 };
  }

  const [products, total] = await Promise.all([
    Product.find(searchQuery)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(),
    Product.countDocuments(searchQuery)
  ]);
  
  return { products, total };
};

// Get related products
const getRelatedProductsFromDB = async (productId, limit = 4) => {
  const cacheKey = `related:${productId}:${limit}`;
  
  // Try to get from cache first
  const cachedRelated = await redis.get(cacheKey);
  if (cachedRelated) {
    return JSON.parse(cachedRelated);
  }
  
  // Get the product to find related items
  const product = await Product.findById(productId).select('category tags');
  if (!product) {
    return [];
  }
  
  // Find related products (same category or tags)
  const relatedProducts = await Product.find({
    _id: { $ne: productId },
    isActive: true,
    $or: [
      { category: product.category },
      { tags: { $in: product.tags || [] } } // Add fallback for undefined tags
    ]
  })
  .select('-__v -createdAt -updatedAt') // Exclude unnecessary fields
  .limit(parseInt(limit))
  .lean();
  
  // Cache the results
  await redis.setex(cacheKey, CACHE_TTL.RELATED_PRODUCTS, JSON.stringify(relatedProducts));
  
  return relatedProducts;
};

// Get product counts by status
const getProductCountsFromDB = async () => {
  const cacheKey = 'product:counts';
  
  // Try to get from cache first
  const cachedCounts = await redis.get(cacheKey);
  if (cachedCounts) {
    return JSON.parse(cachedCounts);
  }
  
  // Get counts from database
  const [active, draft, archived, outOfStock] = await Promise.all([
    Product.countDocuments({ status: 'active' }),
    Product.countDocuments({ status: 'draft' }),
    Product.countDocuments({ status: 'archived' }),
    Product.countDocuments({ 
      status: 'active',
      $or: [
        { quantity: { $lte: 0 } },
        { 'variants.quantity': { $lte: 0 } }
      ]
    })
  ]);
  
  const counts = {
    active,
    draft,
    archived,
    outOfStock,
    total: active + draft + archived
  };
  
  // Cache the results
  await redis.setex(cacheKey, CACHE_TTL.PRODUCT_DETAILS, JSON.stringify(counts));
  
  return counts;
};

// Get product variants
const getProductVariantsFromDB = async (productId) => {
  const product = await Product.findById(productId).select('variants');
  return product ? product.variants : [];
};

// Update product inventory
const updateProductInventoryInDB = async ({ productId, quantity, operation = 'set', variantId, session }) => {
  const update = {};
  const options = { new: true, session };
  
  if (variantId) {
    // Update variant inventory
    const product = await Product.findById(productId).session(session);
    const variant = product.variants.id(variantId);
    
    if (!variant) {
      throw new Error('Variant not found');
    }
    
    if (operation === 'increment') {
      variant.quantity += quantity;
    } else if (operation === 'decrement') {
      variant.quantity = Math.max(0, variant.quantity - quantity);
    } else {
      variant.quantity = quantity;
    }
    
    await product.save({ session });
    return product;
  } else {
    // Update main product inventory
    if (operation === 'increment') {
      update.$inc = { quantity };
    } else if (operation === 'decrement') {
      update.$inc = { quantity: -quantity };
    } else {
      update.quantity = quantity;
    }
    
    return Product.findByIdAndUpdate(productId, update, options);
  }
};

// Get multiple products by IDs
const getProductsByIdsFromDB = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }
  
  return Product.find({
    _id: { $in: ids },
    status: 'active'
  }).lean();
};

// Export all service functions
export const getFeaturedProducts = getFeaturedProductsFromDB;
export const searchProducts = searchProductsInDB;
export const getRelatedProducts = getRelatedProductsFromDB;
export const getProductCounts = getProductCountsFromDB;
export const getProductVariants = getProductVariantsFromDB;
export const updateProductInventory = updateProductInventoryInDB;
export const getProductsByIds = getProductsByIdsFromDB;