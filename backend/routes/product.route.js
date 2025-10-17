import express from 'express';
import { 
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleFeaturedProduct,
  getFeaturedProducts,
  searchProducts,
  getRelatedProducts,
  getProductCounts,
  bulkUpdateProducts,
  getProductVariants,
  updateProductInventory,
  getProductsByIds
} from '../controllers/product.controller.js';
import {
  validateProductData,
  validateProductId,
  validateProductSearch,
  validateVariantData,
  validateBulkOperation,
  validateInventoryUpdate
} from '../validations/product.validations.js';
import { auth, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/search', validateProductSearch, searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', validateProductId, getProductById);
router.get('/:id/related', validateProductId, getRelatedProducts);
router.get('/:id/variants', validateProductId, getProductVariants);
router.post('/batch', getProductsByIds);

// Protected routes (require authentication)
router.use(auth);

// Admin routes
router.use(admin);
router.post('/', validateProductData, createProduct);
router.put('/:id', validateProductId, validateProductData, updateProduct);
router.delete('/:id', validateProductId, deleteProduct);
router.patch('/:id/featured', validateProductId, toggleFeaturedProduct);
router.patch('/:id/inventory', validateProductId, validateInventoryUpdate, updateProductInventory);
router.post('/bulk', validateBulkOperation, bulkUpdateProducts);

export default router;