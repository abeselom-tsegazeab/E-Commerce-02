/**
 * E-Commerce API Server
 * 
 * This is the main entry point for the E-Commerce backend API.
 * It sets up the Express server, configures middleware, connects to the database,
 * and mounts all API routes.
 * 
 * @module server
 */

import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import route handlers
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.route.js';
import couponRoutes from './routes/coupon.route.js';
import paymentRoutes from './routes/payment.route.js';
import analyticsRoutes from './routes/analytics.route.js';

// Database connection
import { connectDB } from './lib/db.js';

// Get the current directory path in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ 
  path: path.resolve(process.cwd(), '.env') 
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// =====================
// Middleware Setup
// =====================

// Enable CORS with configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : 'http://localhost:3000',
  credentials: true, // Enable credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS with the specified options
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Parse JSON bodies (with 10MB limit for file uploads)
app.use(express.json({ limit: '10mb' }));

// Parse cookies for JWT authentication
app.use(cookieParser());

// Logging middleware for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// =====================
// API Routes
// =====================

// Mount API routes
app.use('/api/auth', authRoutes);        // Authentication routes
app.use('/api/products', productRoutes); // Product management
app.use('/api/cart', cartRoutes);        // Shopping cart operations
app.use('/api/coupons', couponRoutes);   // Coupon management
app.use('/api/payments', paymentRoutes); // Payment processing
app.use('/api/analytics', analyticsRoutes); // Analytics and reporting

// =====================
// Production Configuration
// =====================
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist/index.html'));
  });
}

// =====================
// Error Handling Middleware
// =====================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal Server Error'
  });
});

// =====================
// Start Server
// =====================
const server = app.listen(PORT, async () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1); // Exit if we can't connect to the database
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM (for Docker/Kubernetes)
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default server;