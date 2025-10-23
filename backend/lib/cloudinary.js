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
/**
 * Uploads a file to Cloudinary
 * @param {string|Object} file - Can be a file path (string) or a file object with a path or buffer property
 * @param {Object} options - Additional Cloudinary upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export const uploadImage = async (file, options = {}) => {
  try {
    console.log('Starting file upload to Cloudinary...');
    console.log('File type:', typeof file);
    
    // If file is an object with a path property, use that as the file path
    const filePath = file.path || (typeof file === 'string' ? file : null);
    
    if (!filePath && !file.buffer) {
      const error = new Error('Invalid file provided. Expected a file path or a file object with path/buffer.');
      console.error('Invalid file:', file);
      throw error;
    }

    // Get the current time from Cloudinary's API to ensure sync
    const getCloudinaryTime = async () => {
      try {
        const pingResponse = await fetch('https://api.cloudinary.com/v1_1/ping');
        const serverTime = pingResponse.headers.get('date');
        return serverTime ? Math.floor(new Date(serverTime).getTime() / 1000) : Math.floor(Date.now() / 1000);
      } catch (error) {
        console.warn('Could not get time from Cloudinary, falling back to system time');
        return Math.floor(Date.now() / 1000);
      }
    };
    
    // Get a fresh timestamp
    const timestamp = await getCloudinaryTime();
    
    // Create upload options with timestamp
    const uploadOptions = {
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'ecommerce',
      resource_type: 'auto',
      // Remove transformation from here as we'll handle it separately
      ...(options.transformation ? { transformation: options.transformation } : {})
    };
    
    // Remove transformation from options to avoid duplication
    const { transformation, ...otherOptions } = options;
    Object.assign(uploadOptions, {
      ...otherOptions,
      timestamp: timestamp  // Ensure we're using the fresh timestamp
    });
    
    console.log('Generated fresh timestamp:', new Date(timestamp * 1000).toISOString(), `(${timestamp})`);

    console.log('Upload options:', JSON.stringify(uploadOptions, null, 2));

    // Verify Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Missing Cloudinary configuration. Please check your environment variables.');
    }

    // If we have a buffer, use upload_stream, otherwise use regular upload
    if (file.buffer) {
      console.log('Uploading from buffer...');
      return new Promise((resolve, reject) => {
        try {
          // Format the transformation as a string for the upload
          let transformation = [];
          if (uploadOptions.transformation) {
            transformation = uploadOptions.transformation.map(t => {
              const parts = [];
              if (t.width) parts.push(`w_${t.width}`);
              if (t.height) parts.push(`h_${t.height}`);
              if (t.crop) parts.push(`c_${t.crop}`);
              if (t.quality) parts.push(`q_${t.quality}`);
              if (t.fetch_format) parts.push(`f_${t.fetch_format}`);
              return parts.join(',');
            }).filter(Boolean);
          }
          
          // Prepare parameters for signing
          // Note: The order of parameters is important for the signature
          // Cloudinary expects them in this specific order: folder, timestamp, transformation
          const paramsToSign = {};
          
          // Add parameters in the exact order required by Cloudinary
          paramsToSign.folder = uploadOptions.folder;
          paramsToSign.timestamp = uploadOptions.timestamp;
          
          // Add transformation if it exists
          if (transformation.length > 0) {
            paramsToSign.transformation = transformation.join('/');
          }
          
          // Add resource_type if it's not the default 'auto'
          if (uploadOptions.resource_type !== 'auto') {
            paramsToSign.resource_type = uploadOptions.resource_type;
          }
          
          // Prepare upload parameters
          const uploadParams = {
            folder: uploadOptions.folder,
            resource_type: uploadOptions.resource_type,
            timestamp: uploadOptions.timestamp,
            api_key: process.env.CLOUDINARY_API_KEY,
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME
          };
          
          // Add transformation if it exists
          if (transformation.length > 0) {
            uploadParams.transformation = transformation.join('/');
          }
          
          // Generate signature for the upload (without transformations)
          const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET
          );
          
          // Add the signature to the upload params
          uploadParams.signature = signature;
          
          console.log('Parameters used for signing:', JSON.stringify(paramsToSign, null, 2));
          console.log('Generated signature:', signature);
          console.log('Upload parameters:', JSON.stringify(uploadParams, null, 2));
          
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadParams,
            (error, result) => {
              if (error) {
                console.error('Upload stream error:', error);
                return reject(error);
              }
              console.log('Upload successful:', result);
              resolve(result);
            }
          );
          
          uploadStream.on('error', (error) => {
            console.error('Stream error:', error);
            reject(error);
          });
          
          uploadStream.write(file.buffer);
          uploadStream.end();
        } catch (error) {
          console.error('Error in upload stream setup:', error);
          reject(error);
        }
      });
    }

    console.log('Uploading from file path:', filePath);
    
    // For file path uploads, generate signature and include it in the options
    const signature = cloudinary.utils.api_sign_request(
      { ...uploadOptions, timestamp },
      process.env.CLOUDINARY_API_SECRET
    );
    
    console.log('Generated signature for file upload:', signature);
    
    const result = await cloudinary.uploader.upload(filePath, {
      ...uploadOptions,
      signature
    });
    
    console.log('File upload successful:', result);
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
