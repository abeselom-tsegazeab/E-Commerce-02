import axios from 'axios';
import { apiConfig, endpoints } from '../config/api.config';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: apiConfig.baseURL,
  headers: apiConfig.headers,
  withCredentials: apiConfig.withCredentials,
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh token request to avoid infinite loops
      if (originalRequest.url.includes('refresh-token')) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${apiConfig.baseURL}${endpoints.auth.refresh}`,
          {},
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        const { accessToken } = response.data;
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          // Update the default Authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          // Update the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        localStorage.removeItem('accessToken');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // If we get a 401 and it's not a refresh request, redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Auth
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),

  // Products
  getProducts: (params = {}) => api.get(endpoints.products.getAll, { params }),
  getProductById: (id) => api.get(endpoints.products.getById(id)),
  createProduct: (productData) => api.post(endpoints.products.create, productData),
  updateProduct: (id, productData) => api.put(endpoints.products.update(id), productData),
  deleteProduct: (id) => api.delete(endpoints.products.delete(id)),
  searchProducts: (query) => api.get(endpoints.products.search, { params: { q: query } }),

  // Orders
  createOrder: (orderData) => api.post('/orders', orderData),
  getMyOrders: () => api.get('/orders/me'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),

  // Payments
  createPaymentIntent: (amount) => api.post('/payments/create-payment-intent', { amount }),
  confirmPayment: (paymentData) => api.post('/payments/confirm', paymentData),
  getPaymentMethods: () => api.get('/payments/methods'),
  addPaymentMethod: (paymentMethod) => api.post('/payments/methods', paymentMethod),

  // Users
  updateProfile: (userData) => api.put('/users/profile', userData),
  changePassword: (passwords) => api.put('/users/change-password', passwords),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (address) => api.post('/users/addresses', address),
  updateAddress: (id, address) => api.put(`/users/addresses/${id}`, address),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
};

export default api;
