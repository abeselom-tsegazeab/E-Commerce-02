import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

const CategoriesContext = createContext();

export const CategoriesProvider = ({ children }) => {
  // Use React Query for data fetching and caching
  const { data: categories = [], isLoading, isError, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/categories');
        return response.data;
      } catch (err) {
        console.error('Error fetching categories:', err);
        throw new Error('Failed to fetch categories');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes (cacheTime was renamed to gcTime in v5)
    retry: 2,                 // Retry failed requests twice before showing an error
    refetchOnWindowFocus: false // Don't refetch when window regains focus
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
