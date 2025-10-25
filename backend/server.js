/**
 * E-Commerce API Server
 * 
 * This is the main entry point for the E-Commerce backend API.
 * It sets up the Express server, configures middleware, connects to the database,
 * and mounts all API routes.
 * 
 * @module server
 */

// Core Node.js modules
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env file');
  process.exit(1);
}

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'SESSION_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Third-party packages
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';

// Import route handlers
import authRoutes from './routes/auth.route.js';
import socialAuthRoutes from './routes/socialAuth.route.js';
import productRoutes from './routes/product.routes.js';
import alertRoutes from './routes/alert.routes.js';
import productAlertRoutes from './routes/product/alert.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import cartRoutes from './routes/cart.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import attributeRoutes from './routes/attribute.routes.js';
import reviewRoutes from './routes/review.routes.js';
import bulkRoutes from './routes/product/bulk.routes.js';
import comparisonRoutes from './routes/product/comparison.routes.js';
import importExportRoutes from './routes/product/importExport.routes.js';
import { connectDB } from './lib/db.js';
import orderRoutes from './routes/order.routes.js';
import categoryRoutes from './routes/category.routes.js';
// Import Passport configuration
import passport from './lib/passport.js';
import sessionMiddleware from './config/session.config.js';

// Initialize Express app
const app = express();

// Trust first proxy if behind a reverse proxy (e.g., Nginx)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL
    ].filter(Boolean);

    if (!origin || process.env.NODE_ENV === 'development' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-XSRF-TOKEN',
    'X-Forwarded-For',
    'X-Forwarded-Proto',
    'X-Forwarded-Port'
  ],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware
app.use(sessionMiddleware);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', socialAuthRoutes);

// Add debug logging for all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Mount bulk routes first to avoid conflicts
app.use('/api/products/bulk', bulkRoutes);

// Mount other product routes
app.use('/api/products', productRoutes);

// Mount product-specific alert routes
app.use('/api/products', productAlertRoutes);

// Mount main alert routes
app.use('/api/alerts', alertRoutes);

// Test endpoint at root
app.get('/api/test', (req, res) => {
  console.log('Root test endpoint hit');
  res.json({ success: true, message: 'Root test endpoint working' });
});

// Direct route for bulk delete (temporary for debugging)
import { protectRoute, adminRoute } from './middleware/auth.middleware.js';
import { bulkDeleteValidation } from './validations/bulk.validations.js';
import { bulkDeleteProducts } from './controllers/product/bulk.controller.js';

// Convert bulkDeleteValidation array to middleware functions
const bulkDeleteValidationMiddleware = (req, res, next) => {
  return Promise.all(bulkDeleteValidation.map(validation => 
    new Promise((resolve) => {
      validation(req, res, (err) => {
        resolve(err);
      });
    })
  )).then(errors => {
    const error = errors.find(e => e);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Validation failed'
      });
    }
    next();
  }).catch(next);
};

app.delete('/api/products/bulk/delete', 
  (req, res, next) => {
    console.log('Direct bulk delete route hit');
    next();
  },
  protectRoute,
  adminRoute,
  bulkDeleteValidationMiddleware,
  bulkDeleteProducts
);

// Other routes 
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/reviews', reviewRoutes);

// Category routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', importExportRoutes);

// Mount comparison routes
app.use('/api/compare', comparisonRoutes);

// Mount order routes
app.use('/api/orders', orderRoutes);

// Add catch-all route for debugging
app.use('/api/*', (req, res, next) => {
  console.log('Catch-all route hit:', req.originalUrl);
  next(new Error('Endpoint not found'));
});


// Production static files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Start server function
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      }
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error('Server startup failed');
    process.exit(1);
  }
};

// Start the server
let server;
startServer().then(s => {
  server = s;
}).catch(err => {
  console.error('❌ Failed to initialize server:', err);
  process.exit(1);
});

// Handle process termination
const shutdown = () => {
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default server;
