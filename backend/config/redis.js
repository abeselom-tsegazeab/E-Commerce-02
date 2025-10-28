import { createClient } from 'redis';
import logger from '../utils/logger.js';

// Create Redis client
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        logger.error('Max reconnection attempts reached for Redis');
        return new Error('Max reconnection attempts reached');
      }
      // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1.6s, 3.2s
      return Math.min(retries * 100, 3200);
    }
  }
});

// Handle Redis connection events
redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('error', (error) => {
  logger.error('Redis error:', error);
});

redis.on('reconnecting', () => {
  logger.info('Reconnecting to Redis...');
});

redis.on('end', () => {
  logger.warn('Redis connection ended');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redis.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Don't crash the app if Redis is down
    // The app should still work without Redis (with degraded functionality)
  }
};

// Graceful shutdown
const shutdownRedis = async () => {
  try {
    await redis.quit();
    logger.info('Redis client disconnected');
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
  }
};

// Handle process termination
process.on('SIGTERM', shutdownRedis);
process.on('SIGINT', shutdownRedis);

export { redis, connectRedis, shutdownRedis };
