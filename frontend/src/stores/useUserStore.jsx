import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../config";

// Helper function to store auth data
const storeAuthData = (data, rememberMe = false) => {
  const { token, user } = data;
  
  // Store token and user data based on rememberMe preference
  if (rememberMe) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
  }
  
  // Set default auth header
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  return user;
};

// Helper function to clear auth data
const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
};

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,
  error: null,

  // Set user data
  setUser: (user) => set({ user }),
  
  // Set token
  setToken: (token) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  // Sign up with email/password
  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true, error: null });

    if (password !== confirmPassword) {
      set({ loading: false, error: "Passwords do not match" });
      return toast.error("Passwords do not match");
    }

    try {
      console.log('Sending signup request to:', API_ENDPOINTS.AUTH.REGISTER);
      const res = await axios.post(API_ENDPOINTS.AUTH.REGISTER, { 
        name, 
        email, 
        password,
        confirmPassword
      });
      
      if (!res.data || !res.data.success) {
        throw new Error(res.data?.message || 'Registration failed');
      }
      
      // Store user data in the store
      const { user } = res.data;
      set({ user, loading: false });
      
      // Store in local storage
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success(res.data.message || 'Account created successfully!');
      return user;
    } catch (error) {
      const errorMsg = error.response?.data?.message || "An error occurred during signup";
      set({ loading: false, error: errorMsg });
      throw new Error(errorMsg);
    }
  },

  // Login with email/password
  login: async ({ email, password, rememberMe = true }) => {
    console.log('Starting login process...');
    set({ loading: true, error: null });

    try {
      const res = await axios.post(
        API_ENDPOINTS.AUTH.LOGIN, 
        { email, password },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Login response:', res);
      
      if (!res.data || !res.data.user) {
        const errorMsg = res.data?.message || 'Login failed: Invalid response from server';
        console.error('Login failed:', errorMsg);
        set({ loading: false, error: errorMsg });
        throw new Error(errorMsg);
      }
      
      // The backend sets httpOnly cookies, but we'll also store the user data in storage
      console.log('Processing login response data...');
      const { user } = res.data;
      
      // Store user data in storage
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(user));
      
      // Update store state
      console.log('Updating UI state with user data');
      set({ 
        user, 
        loading: false, 
        error: null 
      });
      
      toast.success('Logged in successfully!');
      return user;
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      set({ 
        loading: false, 
        error: errorMessage 
      });
      
      toast.error(errorMessage);
      return Promise.reject(error);
    }
  },

  // Social login
  socialLogin: async (provider, token) => {
    set({ loading: true, error: null });
    
    try {
      const res = await axios.post(
        API_ENDPOINTS.AUTH.SOCIAL_LOGIN(provider), 
        { token },
        { withCredentials: true } // Important for receiving cookies
      );
      
      if (!res.data || !res.data.user) {
        throw new Error('Invalid response from social login');
      }
      
      // The backend should set httpOnly cookies, but we'll also store the token in storage
      const { token: authToken, user } = res.data;
      if (authToken) {
        // For social logins, we'll use localStorage by default
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      }
      
      // Update store state
      set({ 
        user, 
        loading: false, 
        error: null 
      });
      
      toast.success(`Successfully signed in with ${provider}`);
      return user;
    } catch (error) {
      const errorMsg = error.response?.data?.message || `Error signing in with ${provider}`;
      console.error('Social login error:', error);
      set({ loading: false, error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await axios.post("/auth/logout");
      clearAuthData();
      set({ user: null });
      toast.success("Successfully logged out");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "An error occurred during logout";
      toast.error(errorMsg);
    }
  },

  // Check authentication status
  checkAuth: async () => {
    const { checkingAuth } = get();
    if (checkingAuth) return null;
    
    set({ checkingAuth: true });
    
    // Try to get token and user from storage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    // If we have a token, set it in axios headers
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // If we have a stored user, set it immediately for better UX
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        set({ user });
        
        // If we don't have a token but have a user, try to refresh
        if (!token) {
          try {
            await get().refreshToken();
          } catch (error) {
            console.warn('Token refresh failed, logging out:', error);
            clearAuthData();
            set({ user: null, checkingAuth: false });
            return null;
          }
        }
      } catch (e) {
        console.warn('Failed to parse stored user data');
      }
    } else if (!token) {
      // No token and no stored user, we're not authenticated
      set({ checkingAuth: false, user: null });
      return null;
    }

    try {
      // Try to get fresh user data
      const response = await axios.get(API_ENDPOINTS.AUTH.PROFILE, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        const user = response.data;
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        
        // Update stored user data
        storage.setItem('user', JSON.stringify(user));
        
        // If we got a new token in the response, update it
        if (response.data.token) {
          const newToken = response.data.token;
          storage.setItem('token', newToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        } else if (token) {
          // Ensure the current token is set in axios defaults
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        set({ user, checkingAuth: false });
        return user;
      }
      
      // If we have a stored user but no fresh data, use the stored user
      if (storedUser) {
        const user = JSON.parse(storedUser);
        set({ user, checkingAuth: false });
        return user;
      }
      
      // If we get here, we're not authenticated
      clearAuthData();
      set({ checkingAuth: false, user: null });
      return null;
      
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // If we have a stored user but the request failed, try to refresh the token
      if (storedUser) {
        try {
          console.log('Attempting to refresh token...');
          await get().refreshToken();
          const user = JSON.parse(storedUser);
          set({ user, checkingAuth: false });
          return user;
        } catch (refreshError) {
          console.warn('Token refresh failed:', refreshError);
        }
      }
      
      // Clear invalid auth data
      clearAuthData();
      set({ checkingAuth: false, user: null });
      return null;
    }
  },
  
  // Refresh token
  refreshToken: async () => {
    try {
      // First, check if we have a token in storage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
      
      if (!token) {
        throw new Error('No token found');
      }
      
      // Set the current token in the headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Try to refresh the token
      const response = await axios.post(
        API_ENDPOINTS.AUTH.REFRESH,
        {},
        { 
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.data || !response.data.token) {
        throw new Error('Invalid response from refresh token endpoint');
      }
      
      const { token: newToken, user } = response.data;
      
      // Update the stored token and user
      storage.setItem('token', newToken);
      storage.setItem('user', JSON.stringify(user));
      
      // Update axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Update the store
      set({ user });
      
      return user;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Clear auth data on refresh failure
      clearAuthData();
      set({ user: null });
      throw error;
    }
  },
  
  // Get user profile
  getProfile: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.AUTH.PROFILE, {
        withCredentials: true
      });
      
      if (response.data) {
        const user = response.data;
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(user));
        set({ user });
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // If the error is 401, clear auth data
      if (error.response?.status === 401) {
        clearAuthData();
        set({ user: null });
      }
      throw error;
    }
  },

  // Initialize auth state
  
  // Initialize auth state
  initAuth: async () => {
    if (get().checkingAuth) return;
    
    set({ checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      const { token, user } = response.data;
      storeAuthData({ token, user }, true);
      set({ user, checkingAuth: false });
      return user;
    } catch (error) {
      clearAuthData();
      set({ user: null, checkingAuth: false });
      return null;
    }
  },
  
  // Set loading state
  setLoading: (loading) => set({ loading }),
  
  // Set error state
  setError: (error) => set({ error })
}));

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is not 401 or it's a retry request, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    
    // Mark request as retried
    originalRequest._retry = true;
    
    try {
      // If we don't have a refresh in progress, start one
      if (!refreshPromise) {
        refreshPromise = useUserStore.getState().refreshToken()
          .then(token => {
            // Update the authorization header
            if (token) {
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            return token;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      
      // Wait for the refresh to complete
      await refreshPromise;
      
      // Retry the original request with new token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
      }
      
      return axios(originalRequest);
    } catch (refreshError) {
      // If refresh fails, clear auth and redirect to login
      useUserStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);
