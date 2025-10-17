import express from 'express';
import {
  recordProductView,
  recordAddToCart,
  recordProductSale,
  recordProductShare,
  recordWishlistAdd,
  getProductStats,
  getTopProducts,
  getSalesAnalytics,
  updateProductInventory,
  updateProductRating,
  recordTimeSpent
} from '../../controllers/product/stats.controller.js';
import { protectRoute as auth, adminRoute as admin } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  productIdValidation,
  recordSaleValidation,
  recordShareValidation,
  recordRatingValidation,
  recordTimeSpentValidation,
  updateInventoryValidation,
  getProductStatsValidation,
  getTopProductsValidation,
  getSalesAnalyticsValidation
} from '../../validations/product.validations.js';

const router = express.Router({ mergeParams: true });

// Public routes (no authentication required)
router.get(
  '/:id/stats',
  validate(getProductStatsValidation),
  getProductStats
);

router.get(
  '/stats/top',
  validate(getTopProductsValidation),
  getTopProducts
);

// Record product view (public, but rate-limited in production)
router.post(
  '/:id/view',
  validate(productIdValidation),
  recordProductView
);

// Record product share (public, but rate-limited in production)
router.post(
  '/:id/share',
  validate([
    ...productIdValidation,
    ...recordShareValidation
  ]),
  recordProductShare
);

// Protected routes (require authentication)
router.use(auth);

// Record product added to cart
router.post(
  '/:id/cart-add',
  validate(productIdValidation),
  recordAddToCart
);

// Record product added to wishlist
router.post(
  '/:id/wishlist-add',
  validate(productIdValidation),
  recordWishlistAdd
);

// Record time spent on product page
router.post(
  '/:id/time-spent',
  validate([
    ...productIdValidation,
    ...recordTimeSpentValidation
  ]),
  recordTimeSpent
);

// Update product rating
router.patch(
  '/:id/rating',
  validate([
    ...productIdValidation,
    ...recordRatingValidation
  ]),
  updateProductRating
);

// Admin routes (require admin privileges)
router.use(admin);

// Record product sale (typically called from order service)
router.post(
  '/:id/sale',
  validate([
    ...productIdValidation,
    ...recordSaleValidation
  ]),
  recordProductSale
);

// Update product inventory
router.patch(
  '/:id/inventory',
  validate([
    ...productIdValidation,
    ...updateInventoryValidation
  ]),
  updateProductInventory
);

// Get sales analytics (admin only)
router.get(
  '/stats/analytics',
  validate(getSalesAnalyticsValidation),
  getSalesAnalytics
);

export default router;
