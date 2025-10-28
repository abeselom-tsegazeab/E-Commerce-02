import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../errors/rate-limit-error.js';

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    throw new RateLimitError(options.message);
  }
});

// Stricter rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many payment attempts, please try again later.',
  handler: (req, res, next, options) => {
    throw new RateLimitError(options.message, {
      retryAfter: Math.ceil(options.windowMs / 1000), // in seconds
      limit: options.max,
      current: req.rateLimit.current,
      remaining: req.rateLimit.remaining - 1
    });
  }
});

export { apiLimiter, paymentLimiter };
