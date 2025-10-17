/**
 * @module controllers/product
 * @description 
 * Main entry point for all product-related controller functions.
 * This file serves as a thin wrapper that re-exports functionality
 * from the modular implementation in the /product directory.
 */

// Import all controller methods from individual files
import * as productController from './product/product.controller.js';
import * as importExportController from './product/importExport.controller.js';
import * as alertController from './product/alert.controller.js';
import * as bulkController from './product/bulk.controller.js';
import * as comparisonController from './product/comparison.controller.js';
import * as imageController from './product/image.controller.js';
import * as statsController from './product/stats.controller.js';

// Combine all controllers
const allControllers = {
  ...productController,
  ...importExportController,
  ...alertController,
  ...bulkController,
  ...comparisonController,
  ...imageController,
  ...statsController
};

// Export all controllers as default
export default allControllers;

// Also export named exports for direct imports
export * from './product/product.controller.js';
export * from './product/importExport.controller.js';
export * from './product/alert.controller.js';
export * from './product/bulk.controller.js';
export * from './product/comparison.controller.js';
export * from './product/image.controller.js';
export * from './product/stats.controller.js';