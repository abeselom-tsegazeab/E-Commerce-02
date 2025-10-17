import Wishlist from '../models/wishlist.model.js';
import Product from '../models/product.model.js';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';

/**
 * @desc    Get user's wishlist
 * @route   GET /api/wishlist
 * @access  Private
 */
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.getUserWishlist(req.user._id);
  
  res.status(200).json({
    success: true,
    data: wishlist
  });
});

/**
 * @desc    Add item to wishlist
 * @route   POST /api/wishlist/items
 * @access  Private
 */
export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId, notes, priority, customFields } = req.body;
  
  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Get or create wishlist
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  
  if (!wishlist) {
    wishlist = new Wishlist({
      user: req.user._id,
      items: []
    });
  }
  
  // Add item to wishlist
  await wishlist.addItem(productId, { notes, priority, customFields });
  
  // Populate product details
  const updatedWishlist = await Wishlist.findById(wishlist._id)
    .populate('items.product', 'name price images slug stock');
    
  res.status(200).json({
    success: true,
    message: 'Product added to wishlist',
    data: updatedWishlist
  });
});

/**
 * @desc    Remove item from wishlist
 * @route   DELETE /api/wishlist/items/:productId
 * @access  Private
 */
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  
  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }
  
  await wishlist.removeItem(productId);
  
  const updatedWishlist = await Wishlist.findById(wishlist._id)
    .populate('items.product', 'name price images slug stock');
    
  res.status(200).json({
    success: true,
    message: 'Product removed from wishlist',
    data: updatedWishlist
  });
});

/**
 * @desc    Update wishlist item
 * @route   PUT /api/wishlist/items/:productId
 * @access  Private
 */
export const updateWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { notes, priority, customFields } = req.body;
  
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  
  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }
  
  const itemIndex = wishlist.items.findIndex(
    item => item.product.toString() === productId
  );
  
  if (itemIndex === -1) {
    res.status(404);
    throw new Error('Item not found in wishlist');
  }
  
  // Update item fields
  if (notes !== undefined) wishlist.items[itemIndex].notes = notes;
  if (priority) wishlist.items[itemIndex].priority = priority;
  if (customFields) {
    wishlist.items[itemIndex].customFields = {
      ...wishlist.items[itemIndex].customFields,
      ...customFields
    };
  }
  
  await wishlist.save();
  
  const updatedWishlist = await Wishlist.findById(wishlist._id)
    .populate('items.product', 'name price images slug stock');
    
  res.status(200).json({
    success: true,
    message: 'Wishlist item updated',
    data: updatedWishlist
  });
});

/**
 * @desc    Clear wishlist
 * @route   DELETE /api/wishlist/clear
 * @access  Private
 */
export const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  
  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }
  
  wishlist.items = [];
  await wishlist.save();
  
  res.status(200).json({
    success: true,
    message: 'Wishlist cleared',
    data: wishlist
  });
});

/**
 * @desc    Move wishlist item to cart
 * @route   POST /api/wishlist/items/:productId/move-to-cart
 * @access  Private
 */
export const moveToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity = 1 } = req.body;
  
  // This is a placeholder. You'll need to implement the cart functionality
  // or integrate with your existing cart system
  
  // For now, we'll just remove the item from the wishlist
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  
  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }
  
  await wishlist.removeItem(productId);
  
  // TODO: Add the product to the user's cart
  // await addToCart(req.user._id, productId, quantity);
  
  const updatedWishlist = await Wishlist.findById(wishlist._id)
    .populate('items.product', 'name price images slug stock');
    
  res.status(200).json({
    success: true,
    message: 'Product moved to cart',
    data: updatedWishlist
  });
});

/**
 * @desc    Get wishlist by ID (for shared/public wishlists)
 * @route   GET /api/wishlist/shared/:wishlistId
 * @access  Public (for public wishlists)
 */
export const getSharedWishlist = asyncHandler(async (req, res) => {
  const { wishlistId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(wishlistId)) {
    res.status(400);
    throw new Error('Invalid wishlist ID');
  }
  
  const wishlist = await Wishlist.findOne({
    _id: wishlistId,
    isPublic: true,
    expiresAt: { $gt: new Date() }
  }).populate('items.product', 'name price images slug stock');
  
  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found or has expired');
  }
  
  res.status(200).json({
    success: true,
    data: wishlist
  });
});

/**
 * @desc    Update wishlist settings
 * @route   PUT /api/wishlist/settings
 * @access  Private
 */
export const updateWishlistSettings = asyncHandler(async (req, res) => {
  const { isPublic, name, description } = req.body;
  
  const updateFields = {};
  if (isPublic !== undefined) updateFields.isPublic = isPublic;
  if (name) updateFields.name = name;
  if (description !== undefined) updateFields.description = description;
  
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    updateFields,
    { new: true, runValidators: true }
  );
  
  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }
  
  res.status(200).json({
    success: true,
    message: 'Wishlist settings updated',
    data: wishlist
  });
});
