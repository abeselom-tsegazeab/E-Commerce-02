import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import { simpleAuth, protectRoute as auth, adminRoute as admin } from '../../middleware/auth.middleware.js';
import { body, param, query } from 'express-validator';
import { validate } from '../../middleware/validate.middleware.js';
import { 
  subscribeToStockAlert,
  getLowStockProducts,
  getBackInStockProducts,
  updateProductInventory
} from '../../controllers/product/alert.controller.js';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ success: true, message: 'Test endpoint working' });
});

// Subscribe to stock alert (available to all authenticated users)
router.post(
  '/:id/alert',
  simpleAuth,  // Using simpleAuth which only verifies the token, no admin check
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid product ID')
  ],
  validate,
  async (req, res) => {
    console.log('=== SUBSCRIBE TO STOCK ALERT STARTED ===');
    console.log('Request params:', req.params);
    console.log('User from request:', req.user);
    
    try {
      const { id } = req.params;
      const userId = req.user._id;

      console.log('Finding product with ID:', id);
      const product = await Product.findById(id);
      
      if (!product) {
        console.log('Product not found');
        return res.status(404).json({ 
          success: false, 
          message: 'Product not found' 
        });
      }

      console.log('Product found:', product.name);
      console.log('Checking if user is already subscribed...');

      // Initialize watchingUsers if it doesn't exist
      if (!product.watchingUsers) {
        product.watchingUsers = [];
      }

      // Check if user is already subscribed
      if (product.watchingUsers.includes(userId)) {
        console.log('User already subscribed');
        return res.status(400).json({ 
          success: false, 
          message: 'You are already subscribed to stock alerts for this product' 
        });
      }

      console.log('Adding user to watchingUsers array...');
      // Add user to watchingUsers array
      product.watchingUsers.push(userId);
      
      console.log('Saving product...');
      const updatedProduct = await product.save();
      
      console.log('Product saved successfully:', updatedProduct);
      
      return res.status(200).json({
        success: true,
        message: 'You will be notified when this product is back in stock',
        data: {
          productId: product._id,
          productName: product.name,
          isInStock: product.inventory?.quantity > 0 || false
        }
      });
    } catch (error) {
      console.error('ERROR in subscribeToStockAlert:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
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

// Export the router
export default router;
