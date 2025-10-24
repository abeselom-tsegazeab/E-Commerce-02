import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Product from '../../models/product.model.js';
import { validateBulkUpdate } from '../../validations/product.validations.js';

// @desc    Bulk update product status
// @route   PUT /api/products/status
// @route   POST /api/products/status
// @access  Private/Admin
export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { productIds, isActive } = req.body;

  // Validate input
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of product IDs');
  }

  // Convert all IDs to ObjectId and validate
  const objectIds = [];
  for (const id of productIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error(`Invalid product ID: ${id}`);
    }
    objectIds.push(new mongoose.Types.ObjectId(id));
  }

  // Validate isActive is a boolean
  if (typeof isActive !== 'boolean') {
    res.status(400);
    throw new Error('isActive must be a boolean value');
  }

  try {
    const result = await Product.updateMany(
      { _id: { $in: objectIds } },
      { $set: { isActive } },
      { runValidators: true }
    );

    res.json({
      success: true,
      message: `Updated status for ${result.modifiedCount} products`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        acknowledged: result.acknowledged
      }
    });
  } catch (error) {
    console.error('Error in bulkUpdateStatus:', error);
    res.status(500);
    throw new Error('Failed to update product status');
  }
});

// @desc    Bulk update product categories
// @route   PUT /api/products/bulk/categories
// @access  Private/Admin
export const bulkUpdateCategories = asyncHandler(async (req, res) => {
  const { productIds, category, subcategory } = req.body;
  
  const { error } = validateBulkUpdate({ 
    productIds, 
    updates: { category, subcategory } 
  });
  
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const updateData = {};
  if (category) updateData.category = category;
  if (subcategory) updateData.subcategory = subcategory;

  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    { $set: updateData },
    { runValidators: true }
  );

  res.json({
    success: true,
    message: `Updated categories for ${result.nModified} products`,
    data: result
  });
});

// @desc    Bulk update product prices
// @route   PUT /api/products/bulk/prices
// @access  Private/Admin
export const bulkUpdatePrices = asyncHandler(async (req, res) => {
  const { productIds, price, operation = 'set' } = req.body;
  
  const { error } = validateBulkUpdate({ 
    productIds, 
    updates: { price, operation } 
  });
  
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  let updateQuery = {};
  if (operation === 'set') {
    updateQuery = { $set: { price } };
  } else if (operation === 'increase') {
    updateQuery = { $inc: { price } };
  } else if (operation === 'decrease') {
    updateQuery = { $inc: { price: -Math.abs(price) } };
  } else if (operation === 'percentage_increase') {
    updateQuery = [
      {
        $set: {
          price: {
            $multiply: [
              "$price",
              { $add: [1, { $divide: [price, 100] }] }
            ]
          }
        }
      }
    ];
  } else if (operation === 'percentage_decrease') {
    updateQuery = [
      {
        $set: {
          price: {
            $multiply: [
              "$price",
              { $subtract: [1, { $divide: [price, 100] }] }
            ]
          }
        }
      }
    ];
  }

  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    updateQuery,
    { runValidators: true }
  );

  res.json({
    success: true,
    message: `Updated prices for ${result.nModified} products`,
    data: result
  });
});

// @desc    Bulk delete products
// @route   DELETE /api/products/bulk/delete
// @access  Private/Admin
export const bulkDeleteProducts = asyncHandler(async (req, res) => {
  const { productIds } = req.body;
  
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    res.status(400);
    throw new Error('Product IDs are required and must be a non-empty array');
  }

  // Convert all IDs to ObjectId and validate
  const objectIds = [];
  for (const id of productIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error(`Invalid product ID: ${id}`);
    }
    objectIds.push(new mongoose.Types.ObjectId(id));
  }

  const result = await Product.deleteMany({ _id: { $in: objectIds } });

  res.json({
    success: true,
    message: `Successfully deleted ${result.deletedCount} products`,
    data: result
  });
});
