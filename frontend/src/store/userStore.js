import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      // Login action
      login: async (credentials) => {
        try {
          set({ loading: true, error: null });
          // This would be an API call in a real app
          // const response = await api.post('/auth/login', credentials);
          // set({ user: response.data.user, isAuthenticated: true });
          // return response.data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Logout action
      logout: () => {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Reset state
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        });
      },

      // Check authentication status
      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return false;
        }
        
        try {
          set({ loading: true });
          // This would be an API call to verify token in a real app
          // const response = await api.get('/auth/verify');
          // set({ user: response.data.user, isAuthenticated: true });
          // return true;
          return !!token; // Temporary return
        } catch (error) {
          set({ isAuthenticated: false, user: null });
          return false;
        } finally {
          set({ loading: false });
        }
      }
    }),
    {
      name: 'user-storage', // name of the item in the storage (must be unique)
      getStorage: () => localStorage, // (optional) by default, 'localStorage' is used
    }
  )
);

export default useUserStore;
