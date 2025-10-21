import express from 'express';
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  reorderCategories
} from '../controllers/category.controller.js';
import {
  createCategoryValidation,
  updateCategoryValidation,
  getCategoriesValidation,
  reorderCategoriesValidation,
  categoryIdValidation
} from '../validations/category.validations.js';
import { validate } from '../middleware/validate.middleware.js';
import { protectRoute as auth, adminRoute as admin } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getCategoriesValidation, validate, getCategories);
router.get('/:id', categoryIdValidation, validate, getCategory);

// Protected routes (require authentication)
router.use(auth);

// Admin routes
router.use(admin);

// Handle file upload for category image (single file)
const uploadCategoryImage = uploadSingle('image');

// Create category with image upload
router.post(
  '/',
  uploadCategoryImage,
  createCategoryValidation,
  validate,
  createCategory
);

// Update category with optional image upload
router.put(
  '/:id',
  uploadCategoryImage,
  updateCategoryValidation,
  validate,
  updateCategory
);

// Delete category
router.delete(
  '/:id',
  categoryIdValidation,
  validate,
  deleteCategory
);

// Reorder categories
router.post(
  '/reorder',
  reorderCategoriesValidation,
  validate,
  reorderCategories
);

export default router;