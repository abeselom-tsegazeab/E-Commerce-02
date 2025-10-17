import express from 'express';
import { 
  compareProducts, 
  getComparableAttributes 
} from '../../controllers/product/comparison.controller.js';
import { query } from 'express-validator';
import { validate } from '../../middleware/validate.middleware.js';

const router = express.Router();

// Compare products
router.get(
  '/compare',
  [
    query('productIds')
      .isArray({ min: 2, max: 4 })
      .withMessage('You must provide between 2 and 4 product IDs to compare'),
    query('productIds.*')
      .isMongoId()
      .withMessage('Invalid product ID format')
  ],
  validate,
  compareProducts
);

// Get comparable attributes for a category
router.get(
  '/compare/attributes',
  [
    query('categoryId')
      .isMongoId()
      .withMessage('Invalid category ID format')
  ],
  validate,
  getComparableAttributes
);

export default router;
