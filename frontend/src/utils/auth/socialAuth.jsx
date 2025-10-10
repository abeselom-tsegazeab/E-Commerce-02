import axios from 'axios';
import { useUserStore } from '../../stores/useUserStore';
import { toast } from 'react-toastify';
import { API_BASE_URL, API_ENDPOINTS } from '../../config';

const openPopup = (url, title, width = 500, height = 600) => {
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  
  return window.open(
    url,
    title,
    `width=${width},height=${height},left=${left},top=${top},` +
    'menubar=no,toolbar=no,location=no,resizable=no,scrollbars=yes,status=no'
  );
};

const handleOAuth = async (provider) => {
  const userStore = useUserStore.getState();
  
  try {
    userStore.setLoading(true);
    const state = Math.random().toString(36).substring(2);
    const redirectUri = `${window.location.origin}/auth/callback`;
    
    // Store the current path to redirect back after login
    const redirectAfterLogin = window.location.pathname;
    localStorage.setItem('redirectAfterLogin', redirectAfterLogin);
    
    // Store the provider in session storage to handle the callback
    sessionStorage.setItem('oauth_provider', provider);
    
    // Open the OAuth provider's login page in the same window
    const authUrl = new URL(API_ENDPOINTS.AUTH[provider.toUpperCase()], API_BASE_URL);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    
    // Add a flag to indicate this is a popup flow
    authUrl.searchParams.append('popup', 'true');
    
    // Open in a new tab instead of a popup
    const newWindow = window.open(
      authUrl.toString(),
      `oauth-${provider}`,
      'width=600,height=600,top=100,left=100'
    );
    
    if (!newWindow) {
      throw new Error('Popup blocked. Please allow popups for this website.');
    }

    return new Promise((resolve, reject) => {
      // Check if the window is closed by the user
      const checkWindow = setInterval(() => {
        try {
          if (newWindow.closed) {
            clearInterval(checkWindow);
            clearTimeout(timeout);
            window.removeEventListener('storage', handleStorage);
            
            if (!userStore.user) {
              userStore.setLoading(false);
              reject(new Error('Authentication was cancelled'));
            }
          }
        } catch (e) {
          // If we can't access closed status, assume the window is closed
          clearInterval(checkWindow);
          clearTimeout(timeout);
          window.removeEventListener('storage', handleStorage);
          
          if (!userStore.user) {
            userStore.setLoading(false);
            reject(new Error('Authentication was cancelled'));
          }
        }
      }, 500);

      const timeout = setTimeout(() => {
        clearInterval(checkWindow);
        try { newWindow.close(); } catch (e) {}
        window.removeEventListener('storage', handleStorage);
        userStore.setLoading(false);
        reject(new Error('Authentication timed out. Please try again.'));
      }, 300000);

      // Handle storage events for cross-tab communication
      const handleStorage = async (event) => {
        if (event.key === 'oauth_success' && event.newValue) {
          try {
            const { token, user } = JSON.parse(event.newValue);
            
            // Process the login
            await userStore.socialLogin(provider, token);
            
            // Clean up
            clearInterval(checkWindow);
            clearTimeout(timeout);
            window.removeEventListener('storage', handleStorage);
            
            // Close the popup if it's still open
            try { newWindow.close(); } catch (e) {}
            
            // Redirect to the intended page
            const redirectTo = localStorage.getItem('redirectAfterLogin') || '/';
            localStorage.removeItem('redirectAfterLogin');
            
            // Clear the success marker
            localStorage.removeItem('oauth_success');
            
            // Use window.location.href for a full page reload to ensure all state is properly initialized
            window.location.href = redirectTo;
            
            resolve(user);
          } catch (err) {
            console.error('Error during social login:', err);
            toast.error('Failed to complete authentication');
            try { newWindow.close(); } catch (e) {}
            reject(err);
          }
        }
      };
      
      window.addEventListener('storage', handleStorage);
    });
  } catch (error) {
    console.error('OAuth error:', error);
    useUserStore.getState().setLoading(false);
    toast.error(error.message || 'Authentication failed');
    throw error;
  }
};

export const socialAuth = {
  google: {
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    color: 'bg-white hover:bg-gray-50 text-gray-700',
    onClick: () => handleOAuth('google')
  },
  github: {
    name: 'GitHub',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.14 20.161 22 16.416 22 12.017 22 6.484 17.522 2 12 2z"/>
      </svg>
    ),
    color: 'bg-gray-800 hover:bg-gray-900 text-white',
    onClick: () => handleOAuth('github')
  },
  facebook: {
    name: 'Facebook',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: 'bg-[#1877F2] hover:bg-[#166FE5] text-white',
    onClick: () => handleOAuth('facebook')
  },
  twitter: {
    name: 'Twitter',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.554-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63a9.935 9.935 0 002.46-2.548l-.047-.02z"/>
      </svg>
    ),
    color: 'bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white',
    onClick: () => handleOAuth('twitter')
  }
};

export const getEnabledProviders = () => {
  // Using Vite's environment variables
  const enabledProviders = import.meta.env.VITE_ENABLED_SOCIAL_PROVIDERS;
  
  if (!enabledProviders) {
    // Return all providers if none are specified
    return Object.values(socialAuth);
  }
  
  return enabledProviders
    .split(',')
    .map(provider => provider.trim().toLowerCase())
    .filter(provider => socialAuth[provider])
    .map(provider => socialAuth[provider]);
};