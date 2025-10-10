import { useState } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../../config';

const GoogleOAuthButton = ({ disabled = false, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    if (isLoading || disabled) return;
    
    setIsLoading(true);
    
    try {
      // Store the current path for redirecting back after login
      const currentPath = window.location.pathname + window.location.search;
      
      // Create state object with redirect_uri
      const state = {
        redirect_uri: window.location.href,
        timestamp: Date.now()
      };
      
      // Convert state to base64 using browser's btoa (only works with ASCII, so we encodeURIComponent first)
      const stateString = JSON.stringify(state);
      const encodedState = btoa(encodeURIComponent(stateString));
      
      // Redirect to the backend OAuth endpoint with state
      window.location.href = `${API_BASE_URL}/auth/google?state=${encodedState}`;
    } catch (error) {
      console.error('Google OAuth error:', error);
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleGoogleLogin}
      disabled={isLoading || disabled}
      className={`w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium py-3 px-6 rounded-xl border border-gray-200 
        hover:bg-gray-50 hover:shadow-sm active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500/50 
        transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
      whileHover={{ scale: 1.01, boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)' }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      aria-label="Continue with Google"
    >
      {isLoading ? (
        <motion.span
          className="w-5 h-5 border-2 border-gray-300 border-t-emerald-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <motion.svg 
          className="w-5 h-5 flex-shrink-0" 
          viewBox="0 0 24 24"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </motion.svg>
      )}
      <motion.span 
        className="text-sm font-medium text-gray-700"
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isLoading ? 'Signing in...' : 'Continue with Google'}
      </motion.span>
    </motion.button>
  );
};

export default GoogleOAuthButton;