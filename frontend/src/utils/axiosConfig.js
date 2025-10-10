import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  withCredentials: true, // Important for sending/receiving cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000, // 15 seconds timeout
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Resolve only if status code is less than 500
  },
  // CORS settings
  withCredentials: true,
  crossDomain: true,
  // CSRF protection
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN'
});
// Ensure credentials are included in all requests
api.defaults.withCredentials = true;

// Track if a token refresh is in progress
let isRefreshing = false;
// Queue to hold failed requests while refreshing token
let failedQueue = [];

// Process the queue of failed requests with new token
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    try {
      // Ensure withCredentials is set
      config.withCredentials = true;
      
      // Add timestamp to prevent caching for GET requests
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now()
        };
      }
      
      // Don't add Authorization header for login, signup, and refresh-token endpoints
      const publicAuthEndpoints = ['/auth/login', '/auth/signup', '/auth/refresh-token'];
      const isPublicAuthEndpoint = publicAuthEndpoints.some(endpoint => 
        config.url.includes(endpoint)
      );
      
      if (isPublicAuthEndpoint) {
        return config;
      }
      
      // Get the access token from cookies
      const cookies = document.cookie.split('; ');
      const accessToken = cookies
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];
      
      // Add the access token to the request headers if it exists
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced error handling and cookie logging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;
    
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry && 
        !originalRequest.url.includes('/auth/refresh-token') &&
        !originalRequest.url.includes('/auth/login')) {
      
      originalRequest._retry = true;
      
      if (isRefreshing) {
        console.log('Token refresh already in progress, adding to queue');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            const newAccessToken = document.cookie
              .split('; ')
              .find(row => row.startsWith('accessToken='))
              ?.split('=')[1];
              
            if (newAccessToken) {
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
              console.log('Retrying original request with new token');
              return api(originalRequest);
            }
            throw new Error('No new access token available');
          })
          .catch((err) => {
            console.error('Error in queued request retry:', err);
            return Promise.reject(err);
          });
      }

      isRefreshing = true;
      
      try {
        console.log('Refreshing token...');
        await api.post('/auth/refresh-token');
        
        const newAccessToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('accessToken='))
          ?.split('=')[1];
        
        if (!newAccessToken) {
          throw new Error('Failed to get new access token after refresh');
        }
        
        console.log('Token refresh successful, updating header');
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        
        // Retry the original request
        console.log('Retrying original request...');
        const response = await api(originalRequest);
        console.groupEnd();
        return response;
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Clear auth data
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('auth_change');
        
        // Process any queued requests with the error
        processQueue(refreshError, null);
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          console.log('Redirecting to login...');
          window.location.href = '/login';
        }
        
        console.groupEnd();
        return Promise.reject(refreshError);
        
      } finally {
        isRefreshing = false;
      }
    }
    
    // Close error group
    console.groupEnd();
    return Promise.reject(error);
  }
);

export default api;
