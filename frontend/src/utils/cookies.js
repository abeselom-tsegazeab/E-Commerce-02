/**
 * Utility functions for working with cookies
 */

export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  
  return null;
};

export const setCookie = (name, value, days = 7, path = '/') => {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=${path};${process.env.NODE_ENV === 'production' ? 'secure; samesite=lax' : ''}`;
};

export const deleteCookie = (name, path = '/') => {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
};

export const isAuthenticated = () => {
  return !!getCookie('isAuthenticated') || localStorage.getItem('isAuthenticated') === 'true';
};
