import asyncHandler from 'express-async-handler';
import Product from '../../models/product.model.js';

// @desc    Subscribe to stock alert
// @route   POST /api/products/:id/alert
// @access  Private
export const subscribeToStockAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const product = await Product.findById(id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user is already subscribed
  if (product.watchingUsers.includes(userId)) {
    res.status(400);
    throw new Error('You are already subscribed to stock alerts for this product');
  }

  // Add user to watchingUsers array
  product.watchingUsers.push(userId);
  await product.save();

  res.json({
    success: true,
    message: 'You will be notified when this product is back in stock',
    data: {
      productId: product._id,
      productName: product.name,
      isInStock: product.inventory.quantity > 0
    }
  });
});

// @desc    Check for low stock products
// @route   GET /api/products/inventory/low-stock
// @access  Private/Admin
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const { threshold = 10 } = req.query;
  
  const products = await Product.find({
    'inventory.quantity': { $gt: 0, $lte: parseInt(threshold) },
    'inventory.isLowStockAlertSent': false
  }).select('name inventory.quantity inventory.sku');

  // Mark alert as sent
  await Product.updateMany(
    { _id: { $in: products.map(p => p._id) } },
    { 'inventory.isLowStockAlertSent': true }
  );

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Check for back in stock products
// @route   GET /api/products/inventory/back-in-stock
// @access  Private/Admin
export const getBackInStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    'inventory.quantity': { $gt: 0 },
    'inventory.wasOutOfStock': true,
    'inventory.isBackInStockAlertSent': false
  }).select('name inventory.quantity inventory.sku watchingUsers');

  // Mark alert as sent
  await Product.updateMany(
    { _id: { $in: products.map(p => p._id) } },
    { 
      'inventory.isBackInStockAlertSent': true,
      'inventory.wasOutOfStock': false
    }
  );

  res.json({
    success: true,
    count: products.length,
    data: products.map(product => ({
      _id: product._id,
      name: product.name,
      quantity: product.inventory.quantity,
      sku: product.inventory.sku,
      subscribers: product.watchingUsers.length
    }))
  });
});

// @desc    Update product inventory
// @route   PUT /api/products/:id/inventory
// @access  Private/Admin
export const updateProductInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, sku, barcode } = req.body;

  const product = await Product.findById(id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const previousQuantity = product.inventory.quantity;
  const wasOutOfStock = previousQuantity <= 0;
  const isBackInStock = wasOutOfStock && quantity > 0;

  // Update inventory
  product.inventory.quantity = quantity;
  if (sku) product.inventory.sku = sku;
  if (barcode) product.inventory.barcode = barcode;
  
  if (wasOutOfStock && quantity > 0) {
    product.inventory.wasOutOfStock = false;
    product.inventory.isBackInStockAlertSent = false;
  } else if (quantity <= 0) {
    product.inventory.wasOutOfStock = true;
    product.inventory.isLowStockAlertSent = false;
  } else if (quantity <= 10) {
    product.inventory.isLowStockAlertSent = false;
  }

  await product.save();

  res.json({
    success: true,
    message: 'Inventory updated successfully',
    data: {
      productId: product._id,
      name: product.name,
      previousQuantity,
      newQuantity: quantity,
      wasOutOfStock,
      isBackInStock,
      hasSubscribers: product.watchingUsers.length > 0
    }
  });
});
