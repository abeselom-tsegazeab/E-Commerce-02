const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};

export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
  products: {
    getAll: '/products',
    getById: (id) => `/products/${id}`,
    create: '/products',
    update: (id) => `/products/${id}`,
    delete: (id) => `/products/${id}`,
    search: '/products/search',
  },
  orders: {
    create: '/orders',
    getMine: '/orders/me',
    getById: (id) => `/orders/${id}`,
    updateStatus: (id) => `/orders/${id}/status`,
  },
  payments: {
    createPaymentIntent: '/payments/create-payment-intent',
    confirmPayment: '/payments/confirm',
    getPaymentMethods: '/payments/methods',
    addPaymentMethod: '/payments/methods',
  },
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
    changePassword: '/users/change-password',
    addresses: '/users/addresses',
    addressById: (id) => `/users/addresses/${id}`,
  },
};
