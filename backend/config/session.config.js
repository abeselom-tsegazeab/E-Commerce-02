import session from 'express-session';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import MongoStore from 'connect-mongo';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '../..', '.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'SESSION_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    dbName: process.env.MONGO_DB_NAME || 'ecommerce',
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 day in seconds
    autoRemove: 'interval',
    autoRemoveInterval: 60, // Check every hour
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    path: '/',
    // Only set domain in production
    ...(process.env.NODE_ENV === 'production' && { domain: '.yourdomain.com' })
  },
  name: 'ecom.sid',
  proxy: true // Trust the reverse proxy for secure cookies
};

// Create session middleware
const sessionMiddleware = session(sessionConfig);

// Middleware to ensure session is available for OAuth routes
const ensureSession = (req, res, next) => {
  if (!req.session) {
    return res.status(500).json({
      error: 'Session not available',
      message: 'Session support is required for this route'
    });
  }
  next();
};

export { sessionMiddleware as default, ensureSession };