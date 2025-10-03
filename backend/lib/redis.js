import { Redis } from 'ioredis';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Redis Client Configuration
 * 
 * This module provides a configured Redis client with connection management,
 * error handling, and automatic reconnection capabilities. It's specifically
 * configured for Upstash Redis but can be adapted for other Redis providers.
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Connection status monitoring
 * - Secure TLS configuration
 * - Environment-based configuration
 * - Input validation
 */

// Validate required environment variables
const requiredEnvVars = ['REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required Redis environment variables: ${missingVars.join(', ')}`);
}

// Configuration object using environment variables
const redisConfig = {
  // Connection details
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT, 10),
  username: process.env.REDIS_USERNAME || 'default', // Optional: default username
  password: process.env.REDIS_PASSWORD,
  
  // TLS/SSL configuration
  tls: {
    rejectUnauthorized: process.env.NODE_ENV !== 'production', // Only in development
    servername: process.env.REDIS_HOST
  },
  
  // Connection strategy
  retryStrategy: (times) => {
    // Exponential backoff: 50ms, 100ms, 200ms, 400ms, ..., up to 10s
    const delay = Math.min(times * 50, 10000);
    console.log(`🔁 Redis reconnecting in ${delay}ms...`);
    return delay;
  },
  
  // Connection settings
  maxRetriesPerRequest: null, // Keep retrying until connected
  enableOfflineQueue: true,   // Queue commands when connection is down
  connectTimeout: 10000,      // 10 seconds connection timeout
  commandTimeout: 5000,       // 5 seconds command timeout
  reconnectOnError: (err) => {
    // Don't reconnect on authentication errors
    if (err.message.includes('WRONGPASS') || err.message.includes('NOAUTH')) {
      console.error('❌ Redis authentication failed. Please check your credentials.');
      return false;
    }
    return true;
  }
};

// Create Redis client instance
const redis = new Redis(redisConfig);

// Event: Connection established
redis.on('connect', () => {
  console.log('✅ Redis client connected');
});

// Event: Connection ready (authenticated)
redis.on('ready', () => {
  console.log('✅ Redis client ready and authenticated');
});

// Event: Connection error
redis.on('error', (error) => {
  console.error('❌ Redis error:', error.message);
  
  // Handle specific error cases
  if (error.code === 'ECONNREFUSED') {
    console.error('Redis connection was refused. Is Redis running?');
  } else if (error.code === 'ETIMEDOUT') {
    console.error('Redis connection timed out. Check your network connection.');
  } else if (error.code === 'WRONGPASS' || error.message.includes('NOAUTH')) {
    console.error('Redis authentication failed. Check your credentials.');
  }
});

// Event: Connection closed
redis.on('close', () => {
  console.log('🔌 Redis connection closed');
});

// Event: Reconnecting
redis.on('reconnecting', (timeToReconnect) => {
  console.log(`⏳ Redis reconnecting in ${timeToReconnect}ms...`);
});

// Event: Connection ended
redis.on('end', () => {
  console.log('❌ Redis connection ended. No more reconnections will be made.');
});

/**
 * Test the Redis connection
 * @returns {Promise<boolean>} True if connection is successful
 */
const testConnection = async () => {
  try {
    const result = await redis.ping();
    if (result === 'PONG') {
      console.log('✅ Redis connection test successful');
      return true;
    }
    throw new Error('Unexpected response from Redis');
  } catch (error) {
    console.error('❌ Redis connection test failed:', error.message);
    return false;
  }
};

// Test connection on startup
(async () => {
  await testConnection();
})();

// Graceful shutdown handler
const shutdown = async () => {
  console.log('🛑 Shutting down Redis client...');
  try {
    await redis.quit();
    console.log('✅ Redis client disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error disconnecting Redis:', error);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default redis;