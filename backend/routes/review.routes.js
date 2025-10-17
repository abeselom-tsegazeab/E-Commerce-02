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

// Public routes
router.get(
  '/',
  validateProductId,
  reviewQueryValidation,
  validate,
  getProductReviews
);

router.get(
  '/stats',
  validateProductId,
  validate,
  getReviewStats
);

// Protected routes (require authentication)
router.use(protectRoute);

router.post(
  '/',
  validateProductId,
  createReviewValidation,
  validate,
  createReview
);

router.put(
  '/:reviewId',
  validateReviewId,
  updateReviewValidation,
  validate,
  updateReview
);

router.delete(
  '/:reviewId',
  validateReviewId,
  validate,
  deleteReview
);

router.post(
  '/:reviewId/helpful',
  validateReviewId,
  validate,
  markHelpful
);

router.post(
  '/:reviewId/not-helpful',
  validateReviewId,
  validate,
  markNotHelpful
);

export default router;
