import express from 'express';
import { protectRoute as auth, adminRoute as admin } from '../../middleware/auth.middleware.js';
import { body, param, query } from 'express-validator';
import { validate } from '../../middleware/validate.middleware.js';
import { 
  subscribeToStockAlert,
  getLowStockProducts,
  getBackInStockProducts,
  updateProductInventory
} from '../../controllers/product/alert.controller.js';

const router = express.Router();

// Subscribe to stock alert
router.post(
  '/:id/alert',
  auth,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid product ID')
  ],
  validate,
  subscribeToStockAlert
);

// Get low stock products (admin only)
router.get(
  '/inventory/low-stock',
  auth,
  admin,
  [
    query('threshold')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Threshold must be a positive integer')
  ],
  validate,
  getLowStockProducts
);

// Get back in stock products (admin only)
router.get(
  '/inventory/back-in-stock',
  auth,
  admin,
  getBackInStockProducts
);

// Update product inventory (admin only)
router.put(
  '/:id/inventory',
  auth,
  admin,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid product ID'),
    body('quantity')
      .isInt({ min: 0 })
      .withMessage('Quantity must be a non-negative integer'),
    body('sku')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('SKU must be between 3 and 50 characters'),
    body('barcode')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Barcode must be between 3 and 50 characters')
  ],
  validate,
  updateProductInventory
);

export default router;
