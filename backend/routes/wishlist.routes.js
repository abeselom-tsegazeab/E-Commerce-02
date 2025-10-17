import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlistItem,
  clearWishlist,
  moveToCart,
  getSharedWishlist,
  updateWishlistSettings
} from '../controllers/wishlist.controller.js';
import {
  addToWishlistValidation,
  updateWishlistItemValidation,
  moveToCartValidation,
  updateWishlistSettingsValidation,
  sharedWishlistValidation
} from '../validations/wishlist.validations.js';
import { validate } from '../middleware/validate.middleware.js';
import {protectRoute as auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get user's wishlist
router.get('/', getWishlist);

// Add item to wishlist
router.post('/items', validate(addToWishlistValidation), addToWishlist);

// Remove item from wishlist
router.delete('/items/:productId', removeFromWishlist);

// Update wishlist item
router.put('/items/:productId', validate(updateWishlistItemValidation), updateWishlistItem);

// Clear wishlist
router.delete('/clear', clearWishlist);

// Move item to cart
router.post('/items/:productId/move-to-cart', validate(moveToCartValidation), moveToCart);

// Update wishlist settings
router.put('/settings', validate(updateWishlistSettingsValidation), updateWishlistSettings);

// Public route for shared wishlists (no auth required)
router.get('/shared/:wishlistId', validate(sharedWishlistValidation), getSharedWishlist);

export default router;
