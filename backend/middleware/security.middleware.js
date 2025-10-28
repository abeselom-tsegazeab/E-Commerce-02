import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../errors/rate-limit-error.js';
import { validationResult } from 'express-validator';
import logger from '../utils/logger.js';

/**
 * Rate limiting middleware for API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    throw new RateLimitError('Too many requests, please try again later.');
  },
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip; // Use user ID if authenticated, otherwise IP
  },
});

/**
 * More strict rate limiting for payment endpoints
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: 'Too many payment attempts, please try again later.',
  skipSuccessfulRequests: true, // Only count failed requests
});

/**
 * Middleware to validate request body using express-validator
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Middleware to check for required headers
 */
export const requireHeaders = (requiredHeaders = []) => {
  return (req, res, next) => {
    const missingHeaders = requiredHeaders.filter(header => !req.headers[header.toLowerCase()]);
    
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required headers: ${missingHeaders.join(', ')}`,
      });
    }
    
    next();
  };
};

/**
 * Middleware to validate content type
 */
export const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({
      success: false,
      error: 'Content-Type must be application/json',
    });
  }
  next();
};

/**
 * Middleware to add security headers
 */
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.stripe.com; font-src 'self' data:; connect-src 'self' https://api.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com;"
  );
  
  // Strict Transport Security
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

/**
 * Middleware to log all requests
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || 'anonymous',
    }, 'Request processed');
  });
  
  next();
};
