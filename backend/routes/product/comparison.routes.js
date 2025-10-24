import express from 'express';
import { 
  compareProducts, 
  getComparableAttributes,
  addToComparison 
} from '../../controllers/product/comparison.controller.js';
import { query, body } from 'express-validator';
import { validate } from '../../middleware/validate.middleware.js';
import Product from '../../models/product.model.js';

const router = express.Router();

// Add logging middleware for all comparison routes
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Comparison route accessed:`, {
    method: req.method,
    path: req.path,
    query: req.query,
    params: req.params
  });
  next();
});

// Compare products
router.get(
  '/',
  // Log the raw query parameters for debugging
  (req, res, next) => {
    console.log('Raw query parameters:', JSON.stringify(req.query, null, 2));
    next();
  },
  // Main route handler
  async (req, res, next) => {
    try {
      let productIds = [];
      
      // Handle different formats of productIds
      if (req.query.productIds) {
        const { productIds: ids } = req.query;
        
        // Case 1: Object format (e.g., ?productIds[id1]=1&productIds[id2]=1)
        if (ids && typeof ids === 'object' && !Array.isArray(ids)) {
          productIds = Object.keys(ids);
        }
        // Case 2: Array format (e.g., ?productIds[]=id1&productIds[]=id2)
        else if (Array.isArray(ids)) {
          productIds = ids;
        }
        // Case 3: Single ID (e.g., ?productIds=id1)
        else if (typeof ids === 'string') {
          productIds = [ids];
        }
      }
      
      console.log('Processed product IDs:', productIds);
      
      // Validate number of IDs
      if (productIds.length < 2 || productIds.length > 4) {
        return res.status(400).json({
          success: false,
          message: 'You must provide between 2 and 4 product IDs to compare',
          receivedIds: productIds.length
        });
      }
      
      // Validate ID format
      const invalidIds = productIds.filter(id => !/^[0-9a-fA-F]{24}$/.test(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID format',
          invalidIds
        });
      }
      
      // Update the request with processed IDs
      req.query.productIds = productIds;
      
      // Call the controller
      console.log('Calling compareProducts controller with IDs:', productIds);
      await compareProducts(req, res, next);
      
    } catch (error) {
      console.error('Error in comparison route:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing comparison request',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Get comparable attributes for a category
router.get(
  '/attributes',
  [
    query('categoryId')
      .isMongoId()
      .withMessage('Invalid category ID format')
  ],
  validate,
  getComparableAttributes
);

// Error handling for comparison routes
router.use((err, req, res, next) => {
  console.error('Error in comparison route:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: 'Error processing comparison request',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

export default router;
