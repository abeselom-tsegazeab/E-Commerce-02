import { validationResult } from 'express-validator';

/**
 * Middleware to validate request using express-validator
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const validateRequest = (req, res, next) => {
    // Get validation errors from the request
    const errors = validationResult(req);
    
    // If there are validation errors, return a 400 response with the errors
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg,
                value: err.value
            }))
        });
    }
    
    // If no errors, proceed to the next middleware/controller
    next();
};

/**
 * Middleware factory for validating file uploads
 * @param {string} fieldName - Name of the file field in the form data
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {import('express').RequestHandler} Express middleware function
 */
const validateFileUpload = (fieldName, allowedTypes, maxSize) => {
    return (req, res, next) => {
        if (!req.files || !req.files[fieldName]) {
            return res.status(400).json({
                success: false,
                message: `No ${fieldName} file uploaded`
            });
        }

        const file = req.files[fieldName];
        
        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
            });
        }

        // Check file size
        if (file.size > maxSize) {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
            });
        }

        next();
    };
};

/**
 * Middleware to validate MongoDB IDs in request parameters
 * @param {string[]} paramNames - Array of parameter names to validate
 * @returns {import('express').RequestHandler} Express middleware function
 */
const validateMongoId = (paramNames) => {
    return (req, res, next) => {
        const errors = [];
        
        paramNames.forEach(param => {
            const value = req.params[param];
            if (value && !/^[0-9a-fA-F]{24}$/.test(value)) {
                errors.push({
                    field: param,
                    message: 'Invalid ID format',
                    value: value
                });
            }
        });
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        
        next();
    };
};

export {
    validateRequest,
    validateFileUpload,
    validateMongoId
};

// Usage examples in routes:
// 1. For request body validation:
// router.post('/', [
//   body('name').notEmpty().withMessage('Name is required'),
//   body('price').isNumeric().withMessage('Price must be a number'),
//   validateRequest
// ], controller.createProduct);
//
// 2. For file uploads:
// router.post('/upload', [
//   upload.single('image'),
//   validateFileUpload('image', ['image/jpeg', 'image/png'], 5 * 1024 * 1024)
// ], controller.uploadImage);
//
// 3. For ID validation:
// router.get('/:id', validateMongoId(['id']), controller.getProductById);
