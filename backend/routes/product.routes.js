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
  getProductsByIds,
  updateProductVariants
} from '../controllers/product.controller.js';
import { updateProductInventory } from '../controllers/product/stats.controller.js';
import reviewRoutes from './review.routes.js';
import imageRoutes from './product/image.routes.js';
import statsRoutes from './product/stats.routes.js';
import importExportRoutes from './product/importExport.routes.js';
import bulkRoutes from './product/bulk.routes.js';
import comparisonRoutes from './product/comparison.routes.js';
import alertRoutes from './product/alert.routes.js';
import {
  validateProductData,productIdValidation as
  validateProductId,
  validateProductSearch,
  validateVariantData,
  validateBulkOperation,updateInventoryValidation as
  validateInventoryUpdate,
  getProductValidation
} from '../validations/product.validations.js';
import { protectRoute as auth, adminRoute as admin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = express.Router({ mergeParams: true });

// Public routes
router.get('/', getAllProducts);
router.get('/search', validate(validateProductSearch), searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', validate(getProductValidation), getProductById);
router.get('/:id/related', validate(validateProductId), getRelatedProducts);
router.get('/:id/variants', validate(validateProductId), getProductVariants);
router.patch(
  '/:id/variants', 
  auth, 
  admin, 
  validate(validateProductId), 
  validate(validateVariantData), 
  updateProductVariants
);
router.post('/batch', getProductsByIds);

// Mount review routes
router.use('/:productId/reviews', reviewRoutes);

// Mount image routes
router.use('/:id/images', imageRoutes);

// Mount stats routes
router.use('', statsRoutes); // Mount at root to handle /products/stats/*

// Mount import/export routes
router.use('', importExportRoutes); // Mount at root to handle /products/export, /products/import, etc.

// Mount bulk operation routes
router.use('', bulkRoutes); // Mount at root to handle /products/bulk/*

// Mount comparison routes
router.use('', comparisonRoutes); // Mount at root to handle /products/compare, /products/compare/attributes

// Mount alert routes
router.use('', alertRoutes); // Mount at root to handle /products/:id/alert, /products/inventory/*

// Protected routes (require authentication)
router.use(auth);

// Admin routes
router.use(admin);
router.post('/', validate(validateProductData), createProduct);
router.put('/:id', validate(validateProductId), validate(validateProductData), updateProduct);
router.delete('/:id', validate(validateProductId), deleteProduct);
router.patch('/:id/featured', validate(validateProductId), toggleFeaturedProduct);
router.patch('/:id/inventory', validate(validateProductId), validate(validateInventoryUpdate), updateProductInventory);
router.post('/bulk', validate(validateBulkOperation), bulkUpdateProducts);

export default router;
