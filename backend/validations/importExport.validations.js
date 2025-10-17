import { body, query } from 'express-validator';

export const exportProductsValidation = [
  query('format')
    .optional()
    .isIn(['json', 'csv', 'xlsx'])
    .withMessage('Invalid export format. Must be one of: json, csv, xlsx'),
    
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID format'),
    
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean value')
    .toBoolean(),
    
  query('inStock')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('inStock must be either "true" or "false"')
    .toBoolean(),
    
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number')
    .toFloat(),
    
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number')
    .toFloat()
    .custom((value, { req }) => {
      if (req.query.minPrice && value < req.query.minPrice) {
        throw new Error('Maximum price must be greater than or equal to minimum price');
      }
      return true;
    }),
    
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be less than 100 characters')
];

export const importProductsValidation = [
  // File validation is handled by multer middleware
  // This is just a placeholder for any additional validation
  body('updateExisting')
    .optional()
    .isBoolean()
    .withMessage('updateExisting must be a boolean value')
    .toBoolean(),
    
  body('notifyOnCompletion')
    .optional()
    .isBoolean()
    .withMessage('notifyOnCompletion must be a boolean value')
    .toBoolean(),
    
  body('email')
    .if((value, { req }) => req.body.notifyOnCompletion === true)
    .notEmpty()
    .withMessage('Email is required when notifyOnCompletion is true')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
];

export const downloadTemplateValidation = [
  query('format')
    .optional()
    .isIn(['json', 'csv', 'xlsx'])
    .withMessage('Invalid template format. Must be one of: json, csv, xlsx')
];

export const getImportStatusValidation = [
  // Add any validation for import status parameters
  // For example, you might want to validate the import ID format
];

// Middleware to handle file upload validation
export const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  const allowedTypes = [
    'text/csv',
    'application/json',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const fileExt = req.file.originalname.split('.').pop().toLowerCase();
  const allowedExtensions = ['csv', 'json', 'xls', 'xlsx'];
  
  if (!allowedTypes.includes(req.file.mimetype) || !allowedExtensions.includes(fileExt)) {
    // Clean up the uploaded file
    if (req.file.path) {
      const fs = require('fs');
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting invalid file:', err);
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Allowed types: CSV, JSON, Excel (XLS/XLSX)'
    });
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    // Clean up the uploaded file
    if (req.file.path) {
      const fs = require('fs');
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting large file:', err);
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 10MB'
    });
  }
  
  next();
};
