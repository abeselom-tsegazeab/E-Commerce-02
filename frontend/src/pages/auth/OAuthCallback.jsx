import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../lib/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getCookie } from '../../utils/cookies';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setUser } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      console.log('Starting OAuth callback handling...');
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Current URL search params:', Object.fromEntries(searchParams.entries()));
        
        // Check for error from OAuth provider
        const errorParam = searchParams.get('error');
        if (errorParam) {
          const errorMsg = searchParams.get('error_description') || 'Authentication failed. Please try again.';
          console.error('OAuth error:', { errorParam, errorMsg, searchParams: Object.fromEntries(searchParams.entries()) });
          setError(errorMsg);
          toast.error(errorMsg);
          
          // If this was opened in a popup, close it and let the parent handle the error
          if (window.opener) {
            console.log('Closing popup window...');
            window.close();
          } else {
            console.log('Redirecting to login page...');
            navigate('/login', { replace: true, state: { from: location.state?.from || '/' } });
          }
          return;
        }
        // Check if we have a token in the URL (client-side flow)
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        
        if (accessToken && refreshToken) {
          // This is the old client-side token handling
          // For now, redirect to login since we're using HTTP-only cookies
          navigate('/login', { 
            replace: true, 
            state: { 
              from: location.state?.from || '/',
              error: 'Please use the login page to authenticate.' 
            }
          });
          return;
        }

        console.log('Handling server-side OAuth flow...');
        try {
          console.log('1. Checking authentication status with /api/auth/me...');
          
          // First, try to get the user profile with credentials
          const response = await axios.get('/api/auth/me', { 
            withCredentials: true,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          console.log('2. Auth/me response:', response.data);
          
          if (response.data?.user) {
            console.log('3. User data received, updating auth context...');
            
            // Update the user in auth context
            setUser(response.data.user);
            
            // Set a flag in localStorage to indicate user is authenticated
            localStorage.setItem('isAuthenticated', 'true');
            
            console.log('4. Auth context updated successfully');
            
            // Show success message
            toast.success('Successfully logged in!');
            
            // If this was opened in a popup, close it
            if (window.opener) {
              console.log('5. Closing popup window...');
              window.close();
            } else {
              // Navigate to the intended destination or home
              const redirectTo = location.state?.from || '/';
              console.log(`5. Redirecting to: ${redirectTo}`);
              navigate(redirectTo, { 
                replace: true,
                state: { user: response.data.user }
              });
            }
          } else {
            throw new Error('Authentication failed: No user data received');
          }
        } catch (error) {
          console.error('OAuth authentication error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
          });
          
          const errorMsg = error.response?.data?.message || 'Authentication failed. Please try again.';
          setError(errorMsg);
          toast.error(errorMsg);
          
          console.log('Redirecting to login page with error...');
          navigate('/login', { 
            replace: true, 
            state: { 
              from: location.state?.from || '/',
              error: errorMsg
            } 
          });
        }
      } catch (err) {
        console.error('Authentication error:', err);
        const errorMessage = err.message || 'An error occurred during authentication';
        setError(errorMessage);

        // Show error message
        toast.error(errorMessage);

        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { error: errorMessage }
          });
        }, 1000);
      } finally {
        setIsLoading(false);
      }
    };

    handleAuth();
  }, [navigate, location.state?.from]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="text-red-500 mb-4">
            <svg 
              className="h-12 w-12 mx-auto" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting you to the app...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
