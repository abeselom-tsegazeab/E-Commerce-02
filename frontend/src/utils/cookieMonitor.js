/**
 * Utility functions for cookie management
 */

/**
 * Get all cookies as an object
 * @returns {Object} An object containing all cookies
 */
export const getAllCookies = () => {
  if (typeof document === 'undefined') return {};
  
  return document.cookie.split(';').reduce((cookies, cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      cookies[name] = valueParts.join('=');
    }
    return cookies;
  }, {});
};

/**
 * Get a specific cookie by name
 * @param {string} name - The name of the cookie to get
 * @returns {string|null} The cookie value or null if not found
 */
export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};
