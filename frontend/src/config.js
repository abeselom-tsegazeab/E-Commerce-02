// API Configuration - Ensure no trailing slash
export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

// Other configuration constants
export const APP_NAME = 'QuantumShop';
export const APP_VERSION = '1.0.0';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh-token',
    PROFILE: '/auth/me',  // Updated to use /auth/me
    GOOGLE: '/auth/google',
    GITHUB: '/auth/github',
    FACEBOOK: '/auth/facebook',
    CALLBACK: '/auth/callback',
    // Helper function for social login endpoints
    SOCIAL_LOGIN: (provider) => `/auth/${provider}/callback`
  },
  PRODUCTS: '/products',
  CARTS: '/cart',
  ORDERS: '/orders'
};
