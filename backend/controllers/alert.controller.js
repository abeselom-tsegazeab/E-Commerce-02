import asyncHandler from 'express-async-handler';
import Alert from '../models/alert.model.js';
import Product from '../models/product.model.js';

// @desc    Create a new stock alert
// @route   POST /api/alerts
// @access  Private
export const createAlert = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userId = req.user._id;

  // Check if product exists and is out of stock
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if product is already in stock
  if (product.inventory.quantity > 0) {
    res.status(400);
    throw new Error('Product is already in stock');
  }

  // Check if alert already exists
  const existingAlert = await Alert.findOne({
    user: userId,
    product: productId,
    status: 'pending'
  });

  if (existingAlert) {
    res.status(400);
    throw new Error('You already have a pending alert for this product');
  }

  // Create new alert
  const alert = await Alert.create({
    user: userId,
    product: productId,
    status: 'pending'
  });

  // Add user to product's watchingUsers array if not already there
  if (!product.watchingUsers.includes(userId)) {
    product.watchingUsers.push(userId);
    await product.save();
  }

  res.status(201).json({
    success: true,
    message: 'You will be notified when this product is back in stock',
    data: alert
  });
});

// @desc    Get user's alerts
// @route   GET /api/alerts
// @access  Private
export const getUserAlerts = asyncHandler(async (req, res) => {
  const alerts = await Alert.find({ user: req.user._id })
    .populate('product', 'name price images inventory')
    .sort('-createdAt');

  res.json({
    success: true,
    count: alerts.length,
    data: alerts
  });
});

// @desc    Delete an alert
// @route   DELETE /api/alerts/:id
// @access  Private
export const deleteAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!alert) {
    res.status(404);
    throw new Error('Alert not found');
  }

  // Remove user from product's watchingUsers array if no other alerts exist
  const otherAlerts = await Alert.findOne({
    user: req.user._id,
    product: alert.product,
    status: 'pending'
  });

  if (!otherAlerts) {
    await Product.findByIdAndUpdate(
      alert.product,
      { $pull: { watchingUsers: req.user._id } },
      { new: true }
    );
  }

  res.json({
    success: true,
    message: 'Alert removed successfully',
    data: {}
  });
});
