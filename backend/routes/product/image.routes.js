import express from 'express';
import multer from 'multer';
import { 
  addProductImages,
  updateProductImage,
  deleteProductImage,
  setPrimaryImage,
  reorderImages
} from '../../controllers/product/image.controller.js';
import { 
  addImagesValidation,
  updateImageValidation,
  deleteImageValidation,
  setPrimaryImageValidation,
  reorderImagesValidation
} from '../../validations/product.validations.js';
import { protectRoute, adminRoute } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';

const router = express.Router({ mergeParams: true });

// Configure multer for file uploads
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// Apply authentication middleware to all routes
router.use(protectRoute);

// Reorder product images (admin only)
router.patch(
  '/sort',
  adminRoute,
  // Add express.json() with specific options to ensure proper parsing
  express.json({ type: 'application/json' }),
  // Custom middleware to ensure body is properly parsed
  (req, res, next) => {
    try {
      // If body is a string, try to parse it as JSON
      if (typeof req.body === 'string') {
        req.body = JSON.parse(req.body);
      }
      next();
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in request body'
      });
    }
  },
  validate(reorderImagesValidation),
  reorderImages
);

// Add images to product (admin only)
router.post(
  '/',
  adminRoute,
  upload.array('images', 10), // 'images' is the field name, max 10 files
  validate(addImagesValidation),
  addProductImages
);

// Update product image (admin only)
router.put(
  '/:imageId',
  adminRoute,
  validate(updateImageValidation),
  updateProductImage
);

// Delete product image (admin only)
router.delete(
  '/:imageId',
  adminRoute,
  validate(deleteImageValidation),
  deleteProductImage
);

// Set primary image (admin only)
router.patch(
  '/:imageId/primary',
  adminRoute,
  validate(setPrimaryImageValidation),
  setPrimaryImage
);

// Reorder images (admin only)
router.patch(
  '/reorder',
  adminRoute,
  validate(reorderImagesValidation),
  reorderImages
);

export default router;
