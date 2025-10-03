import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * MongoDB Connection Handler
 * 
 * This module provides a robust MongoDB connection using Mongoose with:
 * - Environment-based configuration
 * - Connection pooling and timeouts
 * - Event listeners for connection status
 * - Graceful shutdown handling
 * - Comprehensive error handling
 */

// Validate required environment variables
if (!process.env.MONGO_URI) {
  throw new Error('MongoDB connection URI is not defined in environment variables');
}

// Mongoose configuration options
const mongooseOptions = {
  // Connection pooling
  maxPoolSize: 10,                  // Maximum number of connections in the connection pool
  minPoolSize: 1,                   // Minimum number of connections in the connection pool
  serverSelectionTimeoutMS: 5000,   // Time to wait for server selection
  socketTimeoutMS: 45000,           // Close sockets after 45 seconds of inactivity
  family: 4,                       // Use IPv4, skip trying IPv6
  autoIndex: process.env.NODE_ENV !== 'production', // Auto create indexes in non-production
};

// Cache the database connection to prevent multiple connections
let isConnected = false;
let retryAttempts = 0;
const MAX_RETRIES = 3;

/**
 * Establishes a connection to MongoDB using Mongoose
 * @returns {Promise<void>}
 * @throws {Error} If connection cannot be established after retries
 */
export const connectDB = async () => {
  // Return if already connected
  if (isConnected) {
    return;
  }

  try {
    // Attempt to connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    
    // Set connection status
    isConnected = true;
    
    // Log successful connection
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    
    // Set up event listeners
    setupEventListeners(conn);
    
  } catch (error) {
    // Handle connection errors with retry logic
    if (retryAttempts < MAX_RETRIES) {
      retryAttempts++;
      const delay = Math.pow(2, retryAttempts) * 1000; // Exponential backoff
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(); // Retry connection
    }
    
    // Max retries reached, exit process
    console.error('❌ Failed to connect to MongoDB after multiple attempts:', error.message);
    process.exit(1);
  }
};

/**
 * Sets up MongoDB connection event listeners
 * @param {mongoose.Connection} connection - The Mongoose connection instance
 */
const setupEventListeners = (connection) => {
  // Connection events
  connection.on('connected', () => {
    console.log('🔗 MongoDB connection established');  
  });
  
  connection.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Handle specific error cases
    if (error.message.includes('bad auth')) {
      console.error('Authentication failed. Please check your MongoDB credentials');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('Connection refused. Is MongoDB running?');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('MongoDB host not found. Check your connection string');
    }
  });
  
  connection.on('disconnected', () => {
    console.log('ℹ️  MongoDB connection disconnected');
    isConnected = false;
  });
  
  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
};

/**
 * Gracefully closes the MongoDB connection
 */
const gracefulShutdown = async () => {
  console.log('🛑 Closing MongoDB connection...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    process.exit(1);
  }
};

// Export the mongoose instance for models
const db = mongoose.connection;
export default db;
