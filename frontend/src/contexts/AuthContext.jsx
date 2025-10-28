import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { apiService } from '../services/api.service';
import { handleApiCall, formatErrorMessage } from '../utils/api.utils';
import { toast } from 'react-toastify';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  checkAuth: async () => {},
  updateUser: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Derived state for authentication status
  const isAuthenticated = useMemo(() => !!user, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Clear error after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          setError(null);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    if (!isMounted.current) return null;
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      if (isMounted.current) {
        setIsLoading(false);
      }
      return null;
    }
    
    try {
      setIsLoading(true);
      // Set the Authorization header before making the request
      if (api && api.defaults && api.defaults.headers) {
        api.defaults.headers.common = {
          ...api.defaults.headers.common,
          'Authorization': `Bearer ${token}`
        };
      }
      
      const response = await handleApiCall(apiService.getCurrentUser());
      const userData = response?.data || response;

      if (isMounted.current) {
        setUser(userData);
      }
      return userData;
    } catch (err) {
      if (isMounted.current) {
        localStorage.removeItem('accessToken');
        delete apiService.defaults.headers.common['Authorization'];
        setUser(null);
      }
      return null;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      if (!email || !password) {
        throw new Error('Please provide both email and password');
      }
      
      setIsLoading(true);
      setError(null);
      
      // Ensure email is trimmed and in lowercase
      const credentials = {
        email: email.trim().toLowerCase(),
        password: password
      };
      
      // Log the request for debugging
      console.log('Sending login request with:', { email: credentials.email });
      
      // Make the login request
      const response = await api.post('/auth/login', credentials);
      const { accessToken, user: userData, message } = response.data || {};
      
      if (!accessToken || !userData) {
        throw new Error(message || 'Invalid response from server');
      }
      
      // Store the token and update the user state
      localStorage.setItem('accessToken', accessToken);
      
      // Update the default Authorization header
      if (api && api.defaults && api.defaults.headers) {
        api.defaults.headers.common = {
          ...api.defaults.headers.common,
          'Authorization': `Bearer ${accessToken}`
        };
      }
      
      setUser(userData);
      toast.success(message || 'Login successful!');
      
      // Redirect to the intended page or home
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo);
      
      return userData;
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [navigate, location.state?.from?.pathname]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await handleApiCall(apiService.logout());
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await handleApiCall(
        apiService.register(userData)
      );
      
      if (response.user) {
        localStorage.setItem('accessToken', response.accessToken);
        setUser(response.user);
        toast.success('Registration successful!');
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [navigate]);

  // Check authentication status on mount and when location changes
  useEffect(() => {
    if (isMounted.current) {
      checkAuth();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [checkAuth]);

  // Update user function
  const updateUser = useCallback((userData) => {
    setUser(prev => ({
      ...prev,
      ...userData
    }));
  }, []);

  // Memoize the context value
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    checkAuth,
    updateUser
  }), [user, isAuthenticated, isLoading, error, login, logout, register, checkAuth, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
