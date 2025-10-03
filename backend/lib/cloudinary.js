import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Cloudinary Configuration Module
 * 
 * This module provides a configured Cloudinary instance with:
 * - Environment-based configuration
 * - Input validation for required credentials
 * - Secure configuration handling
 * - Error handling for missing or invalid configurations
 */

// Validate required environment variables
const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Cloudinary environment variables: ${missingVars.join(', ')}`
  );
}

// Configure Cloudinary with environment variables
const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS
  timeout: 60000, // 1 minute timeout for uploads
  cdn_subdomain: true, // Enable CDN subdomains for better performance
};

/**
 * Initialize Cloudinary with configuration
 * @throws {Error} If configuration is invalid
 */
const initializeCloudinary = () => {
  try {
    cloudinary.config(config);
    
    // Test configuration by pinging Cloudinary
    cloudinary.api.ping()
      .then(() => console.log('✅ Cloudinary connected successfully'))
      .catch(error => {
        console.error('❌ Cloudinary connection test failed:', error.message);
        if (error.http_code === 401) {
          console.error('Authentication failed. Please check your Cloudinary API key and secret.');
        }
      });
      
    return cloudinary;
  } catch (error) {
    console.error('❌ Failed to initialize Cloudinary:', error.message);
    throw error; // Re-throw to prevent application from starting with invalid configuration
  }
};

// Initialize and export Cloudinary instance
export default initializeCloudinary();

// Utility functions for common operations
export const uploadImage = async (file, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'ecommerce',
      resource_type: 'auto',
      ...options
    });
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error.message);
    throw error;
  }
};

export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'ok') {
      throw new Error(`Failed to delete image: ${result.result}`);
    }
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error.message);
    throw error;
  }
};
