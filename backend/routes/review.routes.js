import express from 'express';
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  markHelpful,
  markNotHelpful,
  getReviewStats
} from '../controllers/review.controller.js';
import {
  createReviewValidation,
  updateReviewValidation,
  reviewQueryValidation,
  validateProductId,
  validateReviewId
} from '../validations/review.validations.js';
import {protectRoute}  from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = express.Router({ mergeParams: true });

// Helper function to create routes for both URL patterns
const createRoutes = (pathSuffix, ...middleware) => {
  const basePath = `reviews/:reviewId/${pathSuffix}`;
  
  // Handle /api/products/reviews/:reviewId/helpful
  router.post(
    `/${basePath}`,
    validateReviewId,
    ...middleware
  );
  
  // Handle /api/products/:productId/reviews/:reviewId/helpful
  router.post(
    `/:productId/${basePath}`,
    validateReviewId,
    ...middleware
  );
};

// Public routes (no authentication required)
router.get(
  '/',
  validateProductId,
  validate(reviewQueryValidation),
  getProductReviews
);

router.get(
  '/stats',
  validateProductId,
  validate,
  getReviewStats
);

// Apply protectRoute middleware to all routes below this point
router.use(protectRoute);

// Mark review as helpful (protected route)
router.post(
  '/:reviewId/helpful',
  validateReviewId,
  markHelpful
);

// Mark review as not helpful (protected route)
router.post(
  '/:reviewId/not-helpful',
  validateReviewId,
  markNotHelpful
);

// Create review (protected route)
router.post(
  '/',
  validateProductId,
  validate(createReviewValidation),
  createReview
);

// Update review (protected route - user can update their own review, admin can update any)
router.put(
  '/:reviewId',
  validateReviewId,
  validate(updateReviewValidation),
  updateReview
);

// Support PATCH method for updating reviews
router.patch(
  '/:reviewId',
  validateReviewId,
  validate(updateReviewValidation),
  updateReview
);

// Delete review (protected route)
router.delete(
  '/:reviewId',
  validateReviewId,
  deleteReview
);

export default router;
