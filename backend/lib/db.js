import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Track connection state
let isConnected = false;

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

// Connection state tracking
const connectionState = {
  isConnected: false,
  retryAttempts: 0,
  MAX_RETRIES: 5,
  isConnecting: false
};

/**
 * Establishes a connection to MongoDB using Mongoose
 * @returns {Promise<void>}
 * @throws {Error} If connection cannot be established after retries
 */
export const connectDB = async () => {
  // Return if already connected or in the process of connecting
  if (connectionState.isConnected || connectionState.isConnecting) {
    return;
  }

  try {
    connectionState.isConnecting = true;
    console.log('🔌 Attempting to connect to MongoDB...');
    
    // Attempt to connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      ...mongooseOptions,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection
      connectTimeoutMS: 10000,        // 10 seconds timeout for initial connection
    });
    
    // Update connection state
    connectionState.isConnected = true;
    connectionState.isConnecting = false;
    connectionState.retryAttempts = 0;
    
    // Set up event listeners
    setupEventListeners(conn.connection);
    
    console.log(`✅ MongoDB connected successfully to ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    
  } catch (error) {
    connectionState.isConnecting = false;
    
    // Handle connection errors with retry logic
    if (connectionState.retryAttempts < connectionState.MAX_RETRIES) {
      const delay = Math.min(1000 * Math.pow(2, connectionState.retryAttempts), 30000);
      connectionState.retryAttempts++;
      
      console.warn(`⚠️  Connection attempt ${connectionState.retryAttempts}/${connectionState.MAX_RETRIES} failed. Retrying in ${delay/1000} seconds...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(); // Retry connection
    }
    
    // Max retries reached
    console.error('❌ Failed to connect to MongoDB after multiple attempts');
    console.error('   Error:', error.message);
    
    // Provide helpful error messages
    if (error.name === 'MongooseServerSelectionError') {
      console.error('   Please check if MongoDB is running and accessible');
      console.error('   Verify your MONGO_URI in the .env file');
    } else if (error.name === 'MongoParseError') {
      console.error('   Invalid MongoDB connection string');
    } else if (error.name === 'MongoNetworkError') {
      console.error('   Network error. Check your internet connection and MongoDB server status');
    }
    
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
    connectionState.isConnected = true;
    console.log('🔗 MongoDB connection established');
  });
  
  connection.on('disconnected', () => {
    connectionState.isConnected = false;
    console.log('⚠️  MongoDB connection lost. Attempting to reconnect...');
    // Attempt to reconnect
    setTimeout(() => connectDB(), 5000);
  });
  
  connection.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Handle specific error cases
    if (error.message.includes('bad auth') || error.name === 'MongoServerError') {
      console.error('❌ Authentication failed. Please check your MongoDB credentials');
      console.error('   Verify your MONGO_URI in the .env file');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('❌ Connection refused. Is MongoDB running?');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('❌ MongoDB host not found. Check your connection string');
    } else if (error.name === 'MongooseServerSelectionError') {
      console.error('❌ Could not connect to any servers in your MongoDB Atlas cluster');
      console.error('   Check your network connection and MongoDB Atlas whitelist settings');
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
