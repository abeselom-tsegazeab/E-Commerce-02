/**
 * Authentication utility functions
 */

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

/**
 * Get the authentication token from localStorage
 * @returns {string|null} The authentication token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Set the authentication token in localStorage
 * @param {string} token - The authentication token
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * Get the current user data from localStorage
 * @returns {Object|null} The user data or null if not found
 */
export const getCurrentUser = () => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Set the current user data in localStorage
 * @param {Object} user - The user data to store
 */
export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Get the authorization header for API requests
 * @returns {Object} The authorization header
 */
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export default {
  getToken,
  setToken,
  getCurrentUser,
  setCurrentUser,
  isAuthenticated,
  clearAuth,
  getAuthHeader
};
