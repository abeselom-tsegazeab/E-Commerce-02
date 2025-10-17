import express from 'express';
import { adminRoute as admin, protectRoute as auth } from '../../middleware/auth.middleware.js';
import { 
  bulkStatusValidation, 
  bulkCategoryValidation, 
  bulkPriceValidation, 
  bulkDeleteValidation 
} from '../../validations/bulk.validations.js';
import { validate } from '../../middleware/validate.middleware.js';
import { 
  bulkUpdateStatus, 
  bulkUpdateCategories, 
  bulkUpdatePrices,
  bulkDeleteProducts
} from '../../controllers/product/bulk.controller.js';

const router = express.Router();

// Bulk update product status
router.put(
  '/bulk/status',
  auth,
  admin,
  bulkStatusValidation,
  validate,
  bulkUpdateStatus
);

// Bulk update product categories
router.put(
  '/bulk/categories',
  auth,
  admin,
  bulkCategoryValidation,
  validate,
  bulkUpdateCategories
);

// Bulk update product prices
router.put(
  '/bulk/prices',
  auth,
  admin,
  bulkPriceValidation,
  validate,
  bulkUpdatePrices
);

// Bulk delete products
router.delete(
  '/bulk',
  auth,
  admin,
  bulkDeleteValidation,
  validate,
  bulkDeleteProducts
);

export default router;
