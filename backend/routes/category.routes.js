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

// Public routes - no authentication required
router.get('/', 
  (req, res, next) => {
    console.log('GET /api/categories', {
      query: req.query,
      params: req.params
    });
    next();
  },
  validate(getCategoriesValidation),  // Pass validation rules here
  getCategories
);

router.get('/:id', validate(categoryIdValidation), getCategory);

// Protected routes (require authentication)
router.use(auth);

// Admin routes (require admin privileges)
router.use(admin);

// Handle file upload for category image (single file)
const uploadCategoryImage = uploadSingle('image');

// Create category with image upload
router.post(
  '/',
  uploadCategoryImage,
  validate(createCategoryValidation),  // Pass validation rules here
  createCategory
);

// Update category with optional image upload
router.put(
  '/:id',
  uploadCategoryImage,
  validate(updateCategoryValidation),
  updateCategory
);

// Delete category
router.delete(
  '/:id',
  validate(categoryIdValidation),
  deleteCategory
);

// Reorder categories
router.post(
  '/reorder',
  validate(reorderCategoriesValidation),
  reorderCategories
);

export default router;