import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  exportProducts, 
  importProducts, 
  downloadTemplate, 
  getImportStatus 
} from '../../controllers/product/importExport.controller.js';
import { 
  exportProductsValidation, 
  importProductsValidation, 
  downloadTemplateValidation, 
  getImportStatusValidation,
  validateFileUpload
} from '../../validations/importExport.validations.js';
import { validateRequest } from '../../middleware/validateRequest.middleware.js';
import { protectRoute as isAuthenticated, adminRoute as isAdmin } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create a temporary uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'temp/uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `import-${uniqueSuffix}${ext}`);
  }
});

// File filter to only allow certain file types
const fileFilter = (req, file, cb) => {
  const filetypes = /csv|json|xlsx|xls/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only CSV, JSON, and Excel files are allowed'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Export products (GET /api/products/export?format=csv|json|xlsx)
router.get(
  '/export',
  isAuthenticated,
  isAdmin,
  exportProductsValidation,
  validateRequest,
  exportProducts
);

// Import products (POST /api/products/import)
router.post(
  '/import',
  isAuthenticated,
  isAdmin,
  upload.single('file'),
  validateFileUpload,
  importProductsValidation,
  validateRequest,
  importProducts
);

// Download import template (GET /api/products/import/template?format=csv|json|xlsx)
router.get(
  '/import/template',
  isAuthenticated,
  isAdmin,
  downloadTemplateValidation,
  validateRequest,
  downloadTemplate
);

// Get import status (GET /api/products/import/status/:id)
router.get(
  '/import/status/:id',
  isAuthenticated,
  isAdmin,
  getImportStatusValidation,
  validateRequest,
  getImportStatus
);

export default router;
