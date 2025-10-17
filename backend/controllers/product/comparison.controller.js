import asyncHandler from 'express-async-handler';
import Product from '../../models/product.model.js';
import Attribute from '../../models/attribute.model.js';

// @desc    Compare products
// @route   GET /api/products/compare
// @access  Public
export const compareProducts = asyncHandler(async (req, res) => {
  const { productIds } = req.query;
  
  if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
    res.status(400);
    throw new Error('Please provide at least 2 product IDs to compare');
  }

  if (productIds.length > 4) {
    res.status(400);
    throw new Error('You can compare up to 4 products at a time');
  }

  // Get products with basic info and specifications
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true
  }).select('name price comparePrice description images specifications category');

  if (products.length < 2) {
    res.status(400);
    throw new Error('Could not find enough active products to compare');
  }

  // Get all specification keys from all products
  const allSpecs = new Set();
  products.forEach(product => {
    if (product.specifications) {
      Object.keys(product.specifications).forEach(key => allSpecs.add(key));
    }
  });

  // Get attribute details for specifications
  const attributes = await Attribute.find({
    slug: { $in: Array.from(allSpecs) }
  }).select('name slug type values isFilterable unit');

  // Create attribute map for quick lookup
  const attributeMap = {};
  attributes.forEach(attr => {
    attributeMap[attr.slug] = {
      name: attr.name,
      type: attr.type,
      unit: attr.unit || '',
      isFilterable: attr.isFilterable
    };
  });

  // Format specifications for comparison
  const specifications = Array.from(allSpecs).map(specSlug => {
    const specData = {
      name: attributeMap[specSlug]?.name || specSlug,
      slug: specSlug,
      type: attributeMap[specSlug]?.type || 'text',
      unit: attributeMap[specSlug]?.unit || '',
      isFilterable: attributeMap[specSlug]?.isFilterable || false,
      values: {}
    };

    // Add each product's value for this specification
    products.forEach(product => {
      specData.values[product._id] = product.specifications?.get(specSlug) || '—';
    });

    return specData;
  });

  // Prepare basic product info for the response
  const productDetails = products.map(product => ({
    _id: product._id,
    name: product.name,
    price: product.price,
    comparePrice: product.comparePrice,
    image: product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || '',
    category: product.category,
    inStock: product.inventory?.quantity > 0 || false
  }));

  res.json({
    success: true,
    data: {
      products: productDetails,
      specifications,
      commonCategories: await getCommonCategories(products)
    }
  });
});

// Helper function to find common categories among products
async function getCommonCategories(products) {
  const categoryIds = [...new Set(products.map(p => p.category?.toString()).filter(Boolean))];
  
  if (categoryIds.length === 0) return [];
  
  // In a real app, you would fetch the actual category names here
  // For now, we'll just return the IDs
  return categoryIds;
}

// @desc    Get comparable attributes for a category
// @route   GET /api/products/compare/attributes
// @access  Public
export const getComparableAttributes = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;
  
  if (!categoryId) {
    res.status(400);
    throw new Error('Category ID is required');
  }

  const attributes = await Attribute.find({
    $or: [
      { category: categoryId },
      { category: { $exists: false } }
    ],
    isFilterable: true
  }).select('name slug type values unit');

  res.json({
    success: true,
    count: attributes.length,
    data: attributes
  });
});
