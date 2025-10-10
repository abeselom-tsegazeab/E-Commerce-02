import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  useRef, 
  useMemo 
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import { getCookie, setCookie, deleteCookie, isAuthenticated } from '../utils/cookies';

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  checkAuth: async () => {},
  updateUser: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const navigate = useNavigate();
  const location = useLocation();

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
  const checkAuth = useCallback(async (options = {}) => {
    if (!isMounted.current) return null;
    
    // Don't set loading on initial check to prevent flash of loading state
    if (options.initialCheck !== true) {
      setLoading(true);
    }
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      
      if (!accessToken || isAuthenticated !== 'true') {
        console.log('No valid session found');
        return null;
      }

      try {
        const { data } = await api.get('/auth/me', { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          // Don't retry on 401 to prevent infinite loops
          validateStatus: status => status < 500
        });

        if (data?.user) {
          console.log('User authenticated:', data.user);
          setUser(data.user);
          return data.user;
        }
      } catch (error) {
        // If the token is invalid, clear it
        if (error.response?.status === 401) {
          console.log('Session expired or invalid, clearing auth data');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('isAuthenticated');
        }
        throw error;
      }
      
      return null;
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      return null;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);
  
  // Check authentication status on initial load
  useEffect(() => {
    let isActive = true;
    
    const checkAuthOnMount = async () => {
      try {
        await checkAuth({ initialCheck: true });
      } catch (error) {
        console.error('Initial auth check failed:', error);
      }
    };
    
    if (isMounted.current) {
      checkAuthOnMount();
    }
    
    return () => {
      isActive = false;
    };
  }, [checkAuth]);

  // Login function
  const login = useCallback(async (credentials = {}) => {
    console.log('AuthContext: Login function called with credentials:', credentials);
    
    // Store the current mounted state
    const mounted = isMounted.current;
    
    try {
      // Only update state if component is still mounted
      if (mounted) {
        setLoading(true);
        setError(null);
      }
      
      console.log('AuthContext: Sending login request to /auth/login');
      const response = await api.post('/auth/login', credentials, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('AuthContext: Login response received:', response);

      if (!response?.data) {
        throw new Error('No data received from server');
      }

      if (response.data.success) {
        const { user, accessToken } = response.data;
        
        if (!user) {
          throw new Error('No user data received from server');
        }
        
        console.log('AuthContext: Login successful, user data:', user);
        
        // Always update storage and state, but only update React state if mounted
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('isAuthenticated', 'true');
          console.log('AuthContext: Access token stored');
          
          // Set the default authorization header for subsequent requests
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
        
        // Update user state even if component unmounted during the request
        // This ensures the user state is consistent across the app
        setUser(user);
        console.log('AuthContext: User state updated');
        
        // Only show toast if component is still mounted
        if (mounted) {
          toast.success('Login successful!');
        }
        
        return user;
      } else {
        const errorMsg = response.data?.message || 'Login failed: Invalid response from server';
        console.error('AuthContext: Login failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('accessToken');
      
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Login failed. Please check your credentials and try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      // Only set loading to false if the component is still mounted
      if (isMounted.current) {
        // Only set loading to false if we're not keeping it for redirect
        setLoading(false);
      }
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      // Clear user state and storage first to ensure UI updates immediately
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('isAuthenticated');
      
      // Then make the logout API call
      await api.post('/auth/logout', {}, { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Logout successful - client-side cleanup complete');
      toast.success('Logged out successfully');
      
      // Clear any axios default headers
      delete api.defaults.headers.common['Authorization'];
      
      return true; // Indicate success
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the server logout fails, we still want to clear the local state
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('isAuthenticated');
      delete api.defaults.headers.common['Authorization'];
      
      const errorMsg = error.response?.data?.message || 'Error during logout';
      console.error('Logout error details:', errorMsg);
      toast.error(errorMsg);
      
      return false; // Indicate failure
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    if (!isMounted.current) return null;
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/register', userData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response?.data?.success) {
        const { user, accessToken } = response.data;
        
        if (!user) {
          throw new Error('No user data received from server');
        }
        
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('isAuthenticated', 'true');
        }
        
        setUser(user);
        toast.success('Registration successful!');
        return user;
      }

      throw new Error('Registration failed: No user data received');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Update user data
  const updateUser = useCallback((userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  }, []);

  // Create a memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      register,
      checkAuth,
      updateUser,
    }),
    [user, loading, error, login, logout, register, checkAuth, updateUser]
  );

  // Check auth status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const hasAuthCookie = document.cookie.includes('token=') || 
                          document.cookie.includes('connect.sid');
      
      if (hasAuthCookie) {
        await checkAuth();
      } else {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [checkAuth]);

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