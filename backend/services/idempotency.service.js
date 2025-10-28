import { redis } from '../config/redis.js';
import logger from '../utils/logger.js';

const IDEMPOTENCY_KEY_PREFIX = 'idempotency:';
const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 hours in seconds

/**
 * Generate a unique idempotency key
 * @param {string} prefix - Key prefix
 * @param {string} userId - User ID
 * @param {string} operation - Operation name
 * @returns {string} Generated idempotency key
 */
const generateIdempotencyKey = (prefix, userId, operation) => {
  return `${IDEMPOTENCY_KEY_PREFIX}${prefix}:${userId}:${operation}:${Date.now()}`;
};

/**
 * Ensure idempotency of operations
 * @param {Object} options - Options
 * @param {string} options.userId - User ID
 * @param {string} options.operation - Operation name (e.g., 'create_payment')
 * @param {Function} options.operationFn - Function to execute if not a duplicate
 * @param {string} [options.idempotencyKey] - Optional custom idempotency key
 * @returns {Promise<Object>} Result of the operation or cached result
 */
export const withIdempotency = async ({
  userId,
  operation,
  operationFn,
  idempotencyKey: customKey,
  ttl = IDEMPOTENCY_TTL
}) => {
  const idempotencyKey = customKey || generateIdempotencyKey('payment', userId, operation);
  const cacheKey = `idempotency:${idempotencyKey}`;
  
  try {
    // Check if we have a cached response for this operation
    const cachedResponse = await redis.get(cacheKey);
    
    if (cachedResponse) {
      logger.info('Idempotent operation - returning cached response', {
        idempotencyKey,
        operation,
        userId
      });
      
      return {
        ...JSON.parse(cachedResponse),
        idempotent: true,
        idempotencyKey
      };
    }
    
    // Execute the operation and cache the result
    const result = await operationFn();
    
    // Cache successful responses (status code 2xx)
    if (result && result.statusCode && result.statusCode >= 200 && result.statusCode < 300) {
      await redis.set(
        cacheKey,
        JSON.stringify(result),
        'EX',
        ttl
      );
      
      logger.info('Cached idempotent operation result', {
        idempotencyKey,
        operation,
        userId,
        ttl
      });
    }
    
    return {
      ...result,
      idempotent: false,
      idempotencyKey
    };
    
  } catch (error) {
    logger.error('Idempotency error', {
      error: error.message,
      stack: error.stack,
      idempotencyKey,
      operation,
      userId
    });
    
    // Don't fail the request if idempotency logic fails
    // Just execute the operation without idempotency
    if (process.env.NODE_ENV === 'production') {
      return operationFn();
    }
    
    throw error;
  }
};

/**
 * Middleware to handle idempotency for HTTP requests
 * @param {Object} options - Options
 * @param {string} options.operation - Operation name
 * @param {number} [options.ttl] - Cache TTL in seconds (default: 24 hours)
 * @returns {Function} Express middleware
 */
export const idempotencyMiddleware = (options = {}) => {
  const { operation, ttl } = options;
  
  return async (req, res, next) => {
    const idempotencyKey = req.headers['idempotency-key'];
    
    // Skip idempotency for GET/HEAD requests or if no operation is specified
    if (['GET', 'HEAD'].includes(req.method) || !operation) {
      return next();
    }
    
    try {
      const userId = req.user?._id || 'anonymous';
      
      // Create a wrapper for the original handler
      const originalSend = res.send;
      
      // @ts-ignore
      res.send = function (body) {
        // @ts-ignore
        this.__responseBody = body;
        // @ts-ignore
        return originalSend.apply(this, arguments);
      };
      
      // @ts-ignore
      res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const cacheKey = `idempotency:${idempotencyKey || generateIdempotencyKey('http', userId, operation)}`;
            // @ts-ignore
            const responseBody = res.__responseBody;
            
            if (responseBody) {
              await redis.set(
                cacheKey,
                JSON.stringify({
                  statusCode: res.statusCode,
                  body: responseBody,
                  headers: res.getHeaders()
                }),
                'EX',
                ttl || IDEMPOTENCY_TTL
              );
              
              logger.info('Cached HTTP response for idempotency', {
                cacheKey,
                operation,
                userId,
                statusCode: res.statusCode
              });
            }
          } catch (error) {
            logger.error('Failed to cache idempotent response', {
              error: error.message,
              operation,
              userId
            });
          }
        }
      });
      
      // Check for existing response if idempotency key is provided
      if (idempotencyKey) {
        const cacheKey = `idempotency:${idempotencyKey}`;
        const cachedResponse = await redis.get(cacheKey);
        
        if (cachedResponse) {
          const { statusCode, body, headers } = JSON.parse(cachedResponse);
          
          // Set response headers
          Object.entries(headers || {}).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
          
          // Add idempotency headers
          res.setHeader('X-Idempotent-Replay', 'true');
          
          logger.info('Serving idempotent response from cache', {
            idempotencyKey,
            operation,
            userId,
            statusCode
          });
          
          return res.status(statusCode).send(body);
        }
      }
      
      next();
      
    } catch (error) {
      logger.error('Idempotency middleware error', {
        error: error.message,
        stack: error.stack,
        operation,
        userId: req.user?._id || 'anonymous'
      });
      
      // Continue with the request if idempotency fails
      next();
    }
  };
};
