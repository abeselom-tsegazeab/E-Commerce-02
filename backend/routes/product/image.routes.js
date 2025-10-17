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

// Apply admin middleware to all routes (only admins can modify product images)
router.use(adminRoute);

// Add images to product
router.post(
  '/',
  upload.array('images', 10), // 'images' is the field name, max 10 files
  validate(addImagesValidation),
  addProductImages
);

// Update image details
router.put(
  '/:imageId',
  validate(updateImageValidation),
  updateProductImage
);

// Delete an image
router.delete(
  '/:imageId',
  validate(deleteImageValidation),
  deleteProductImage
);

// Set primary image
router.patch(
  '/:imageId/primary',
  validate(setPrimaryImageValidation),
  setPrimaryImage
);

// Reorder images
router.patch(
  '/reorder',
  validate(reorderImagesValidation),
  reorderImages
);

export default router;
