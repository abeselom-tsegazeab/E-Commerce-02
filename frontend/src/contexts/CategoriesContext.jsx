import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiService from '../services/api.service';
import { toast } from 'react-toastify';

const CategoriesContext = createContext();

export const CategoriesProvider = ({ children }) => {
  // Use React Query for data fetching and caching
  const { data: categories = [], isLoading, isError, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        console.log('Fetching categories from:', `${apiService.defaults.baseURL}/api/categories`);
        const response = await apiService.get('/api/categories');
        
        // Handle different possible response structures
        let categories = [];
        if (Array.isArray(response.data)) {
          categories = response.data;
        } else if (response.data?.categories && Array.isArray(response.data.categories)) {
          categories = response.data.categories;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          categories = response.data.data;
        }
        
        console.log('Successfully fetched categories:', categories);
        return categories;
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch categories';
        const status = err.response?.status;
        
        console.error('Error fetching categories:', {
          message: errorMessage,
          status,
          code: err.code,
          config: {
            url: err.config?.url,
            baseURL: err.config?.baseURL,
            method: err.config?.method,
          },
          response: err.response?.data,
        });
        
        // Show user-friendly error message
        if (status === 401) {
          toast.error('Please log in to view categories');
        } else if (status === 403) {
          toast.error('You do not have permission to view categories');
        } else if (status >= 500) {
          toast.error('Server error while loading categories');
        } else if (err.code === 'ERR_NETWORK') {
          toast.error('Unable to connect to the server. Please check your connection.');
        } else {
          toast.error(`Error loading categories: ${errorMessage}`);
        }
        
        // Return empty array as fallback
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
    retry: 2,                 // Retry failed requests twice
    refetchOnWindowFocus: false,
    retryDelay: (attempt) => Math.min(attempt * 1000, 5000), // Exponential backoff
  });

  return (
    <CategoriesContext.Provider value={{ 
      categories, 
      loading: isLoading, 
      error: isError ? error : null 
    }}>
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
};

export default CategoriesContext;
