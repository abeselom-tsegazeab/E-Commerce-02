import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `user-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp/;
  const mimetypes = /image\/jpe?g|image\/png|image\/webp/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  
  if (filetypes.test(extname) && mimetypes.test(mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpg, .jpeg, .png, and .webp formats are allowed!'), false);
  }
};

// Create multer instance with configuration
const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    fieldNameSize: 100, // Max field name size
    fieldSize: 20000000, // Max field value size (20MB)
  }
});

// Export middleware functions
export const uploadSingle = (fieldName) => upload.single(fieldName);

export const handleFileUpload = (req, res, next) => {
  console.log('=== handleFileUpload Middleware ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Request body keys:', Object.keys(req.body || {}));
  
  // If no file is being uploaded, skip to next middleware
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
    console.log('No multipart/form-data detected, skipping file upload middleware');
    return next();
  }

  console.log('Processing file upload...');
  
  // Use the upload.single middleware
  upload.single('avatar')(req, res, function(err) {
    if (err) {
      console.error('File upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file.'
      });
    }
    
    console.log('File upload processed. File:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');
    
    // Log the updated request body
    console.log('Request body after upload:', req.body);
    
    next();
  });
};
