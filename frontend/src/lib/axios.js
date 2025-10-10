import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "../config";

// Create axios instance with base url and credentials support
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Important: Set to false when using proxy
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Queue for failed requests
let failedQueue = [];

// Process queue helper function
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

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Skip adding auth header for refresh token request to prevent infinite loop
    if (config.url?.includes('refresh-token')) {
      return config;
    }
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling 401 errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is not 401 or if it's a retry request, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing token, add to queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
      .then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      })
      .catch((err) => {
        return Promise.reject(err);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;
    
    try {
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      if (!refreshToken) {
        // No refresh token available, clear auth and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Try to refresh the token - backend expects refreshToken in cookies
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        {},
        { 
          withCredentials: true, // Important for sending cookies
          skipAuthRefresh: true, // Custom flag to prevent infinite loop
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const { token: newToken, refreshToken: newRefreshToken } = response.data;
      
      // Update tokens in storage
      const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
      storage.setItem('token', newToken);
      if (newRefreshToken) {
        storage.setItem('refreshToken', newRefreshToken);
      }

      // Update the auth header
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      
      // Process the queue and retry the original request
      processQueue(null, newToken);
      return axiosInstance(originalRequest);
      
    } catch (refreshError) {
      // If refresh fails, clear all auth data and redirect to login
      console.error('Failed to refresh token:', refreshError);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
      processQueue(refreshError, null);
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
