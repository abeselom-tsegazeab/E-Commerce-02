import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Product from '../../models/product.model.js';
import Attribute from '../../models/attribute.model.js';

// @desc    Compare products
// @route   GET /api/compare
// @access  Public
export const compareProducts = asyncHandler(async (req, res) => {
  console.log('=== COMPARE PRODUCTS CONTROLLER STARTED ===');
  console.log('Request query:', JSON.stringify(req.query, null, 2));
  
  try {
    // Log incoming request details
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request params:', JSON.stringify(req.params, null, 2));
    
    let { productIds } = req.query;
    console.log('Initial productIds:', JSON.stringify(productIds, null, 2));
    
    // Convert productIds to array if it's an object
    if (productIds && typeof productIds === 'object' && !Array.isArray(productIds)) {
      console.log('Converting object productIds to array');
      productIds = Object.keys(productIds);
    }
    
    console.log('Processed product IDs array:', JSON.stringify(productIds, null, 2));
    
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      console.error('Validation failed: Not enough product IDs provided');
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 product IDs to compare',
        receivedIds: productIds,
        receivedType: typeof productIds
      });
    }

    if (productIds.length > 4) {
      console.error('Validation failed: Too many product IDs');
      return res.status(400).json({
        success: false,
        message: 'You can compare up to 4 products at a time'
      });
    }

    // Validate product IDs
    const invalidIds = productIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      console.error('Validation failed: Invalid product ID format', invalidIds);
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        invalidIds
      });
    }

    // Get products with basic info and specifications
    console.log('Fetching products from database...');
    const query = {
      _id: { $in: productIds },
      isActive: true
    };
    
    console.log('Database query:', JSON.stringify(query, null, 2));
    
    const products = await Product.find(query)
      .select('name price comparePrice description images specifications category')
      .lean();

    console.log(`Found ${products.length} active products`);
    console.log('Products found:', JSON.stringify(products.map(p => ({ _id: p._id, name: p.name })), null, 2));

    if (products.length < 2) {
      console.error('Not enough active products found');
      return res.status(400).json({
        success: false,
        message: 'Could not find enough active products to compare',
        foundProducts: products.length,
        productIdsSearched: productIds
      });
    }

    // Get all specification keys from all products
    const allSpecs = new Set();
    products.forEach(product => {
      if (product.specifications) {
        Object.keys(product.specifications).forEach(key => allSpecs.add(key));
      }
    });

    console.log(`Found ${allSpecs.size} unique specifications`);

    // Get attribute details for specifications
    const attributes = await Attribute.find({
      slug: { $in: Array.from(allSpecs) }
    }).select('name slug type values isFilterable unit');

    console.log(`Found ${attributes.length} attribute definitions`);

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
      description: product.description,
      images: product.images,
      category: product.category
    }));

    console.log('Sending response with comparison data');
    return res.json({
      success: true,
      count: products.length,
      data: {
        products: productDetails,
        specifications,
        commonCategories: await getCommonCategories(products)
      }
    });

  } catch (error) {
    console.error('Error in compareProducts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error comparing products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
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
// @route   GET /api/compare/attributes
// @access  Public
export const getComparableAttributes = asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.query;
    
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    // Get attributes that are marked as comparable for this category
    const attributes = await Attribute.find({
      categories: categoryId,
      isComparable: true
    }).select('name slug type unit');

    return res.json({
      success: true,
      count: attributes.length,
      data: attributes
    });

  } catch (error) {
    console.error('Error getting comparable attributes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting comparable attributes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


