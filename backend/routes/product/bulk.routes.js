import express from 'express';
import mongoose from 'mongoose';
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

const router = express.Router({ mergeParams: true });

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[Bulk Routes] ${req.method} ${req.originalUrl}`);
  next();
});

// Bulk status update route
router.route('/status')
  .put(
    auth,
    admin,
    (req, res, next) => {
      console.log('PUT /status - Request received');
      console.log('Request body:', req.body);
      
      // Direct validation
      const { productIds, isActive } = req.body;
      
      // Validate productIds
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one product ID is required'
        });
      }
      
      // Validate each product ID
      const invalidIds = productIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid product IDs: ${invalidIds.join(', ')}`
        });
      }
      
      // Validate isActive
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value'
        });
      }
      
      // If all validations pass, proceed to the controller
      next();
    },
    bulkUpdateStatus
  )
  .post(
    auth,
    admin,
    (req, res, next) => {
      console.log('POST /status - Request received');
      console.log('Request body:', req.body);
      
      // Direct validation (same as PUT)
      const { productIds, isActive } = req.body;
      
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one product ID is required'
        });
      }
      
      const invalidIds = productIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid product IDs: ${invalidIds.join(', ')}`
        });
      }
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value'
        });
      }
      
      next();
    },
    bulkUpdateStatus
  )
  .all((req, res) => {
    res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });
  });

// Bulk update product categories
router.put(
  '/categories',
  auth,
  admin,
  ...bulkCategoryValidation,
  bulkUpdateCategories
);

// Bulk update product prices
router.put(
  '/prices',
  auth,
  admin,
  ...bulkPriceValidation,
  bulkUpdatePrices
);

// Bulk delete products
router.delete(
  '/delete',
  auth,
  admin,
  ...bulkDeleteValidation,
  (req, res, next) => {
    console.log('DELETE /bulk/delete - Request received');
    console.log('Request body:', req.body);
    next();
  },
  bulkDeleteProducts
);

export default router;
