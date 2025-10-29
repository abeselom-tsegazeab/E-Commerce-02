import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { apiService } from '../services/api.service';
import { handleApiCall, formatErrorMessage } from '../utils/api.utils';
import { toast } from 'react-toastify';

const ProductsContext = createContext({
  products: [],
  featuredProducts: [],
  product: null,
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  filters: {},
  sortBy: 'newest',
  searchQuery: '',
  // Actions
  fetchProducts: () => {},
  fetchProductById: () => {},
  fetchFeaturedProducts: () => {},
  searchProducts: () => {},
  updateFilters: () => {},
  updateSort: () => {},
  clearFilters: () => {},
});

export const ProductsProvider = ({ children }) => {
  const [state, setState] = useState({
    products: [],
    featuredProducts: [],
    product: null,
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    filters: {
      category: '',
      priceRange: [0, 1000],
      inStock: false,
      rating: 0,
    },
    sortBy: 'newest',
    searchQuery: '',
  });

  // Helper to update state
  const updateState = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      ...updates,
      error: null, // Clear previous errors on new actions
    }));
  }, []);

  // Fetch all products with pagination, filtering, and sorting
  const fetchProducts = useCallback(async (page = 1, options = {}) => {
    try {
      // Only update loading state if we're not just updating filters
      if (!options.skipLoading) {
        updateState({ loading: true });
      }
      
      const { filters: newFilters = state.filters || {}, sortBy = state.sortBy || 'newest' } = options;
      
      console.log('Current filters:', newFilters);
      
      // Clean up filters - remove any undefined, null, or empty values
      const cleanedFilters = {};
      let hasActiveFilters = false;

      Object.entries(newFilters).forEach(([key, value]) => {
        // Skip empty arrays and objects
        if (Array.isArray(value) && value.length === 0) return;
        if (value === undefined || value === null || value === '') return;
        
        // Skip inStock: false to show all products by default
        if (key === 'inStock' && value === false) return;
        
        // Handle price range filter
        if (key === 'priceRange' && Array.isArray(value) && value.length === 2) {
          const [minPrice, maxPrice] = value;
          if (minPrice > 0 || maxPrice < 1000) { // Only consider it a filter if not default values
            hasActiveFilters = true;
            cleanedFilters.minPrice = minPrice;
            cleanedFilters.maxPrice = maxPrice;
          }
          return;
        }

        // For other filters, check if they're non-default values
        if (value !== false && value !== 0) {
          hasActiveFilters = true;
        }
        cleanedFilters[key] = value;
      });

      // Map frontend sortBy to backend sort format
      const sortMap = {
        'price-lowest': 'price',
        'price-highest': '-price',
        'name-a': 'name',
        'name-z': '-name',
        'newest': '-createdAt',
        'oldest': 'createdAt'
      };
      
      const sort = sortMap[sortBy] || '-createdAt';
      console.log('Sorting by:', sortBy, '->', sort);

      const params = {
        page,
        limit: 12,
        sort,
        ...(hasActiveFilters && cleanedFilters) // Only spread filters if there are active ones
      };

      console.log('Final API params:', JSON.stringify(params, null, 2));
      
      let response;
      if (hasActiveFilters) {
        console.log('Using search endpoint with filters');
        response = await apiService.searchProducts(params);
      } else {
        console.log('Using base products endpoint');
        response = await apiService.getProducts(params);
      }

      const data = await handleApiCall(response);
      
      // Handle the response format where products are in data.docs
      const products = data.docs || [];
      const currentPage = data.page || 1;
      const totalPages = data.totalPages || 1;
      const totalItems = data.totalDocs || 0;
      
      console.log(`Found ${products.length} products`);
      
      updateState({
        products,
        currentPage,
        totalPages,
        totalItems,
        loading: false,
        filters: newFilters, // Keep the original filters in state
        sortBy,
      });
      
      return { products, currentPage, totalPages, totalItems };
      } catch (apiError) {
        console.error('API Error details:', {
          message: apiError.message,
          response: apiError.response?.data,
          status: apiError.response?.status,
          config: {
            url: apiError.config?.url,
            method: apiError.config?.method,
            params: apiError.config?.params,
            data: apiError.config?.data,
          },
        });
        throw apiError;
      }
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      updateState({ 
        error: errorMessage,
        loading: false 
      });
      toast.error(errorMessage);
      throw error;
    }
  }, [state.filters, state.sortBy]);

  // Fetch a single product by ID
  const fetchProductById = useCallback(async (id) => {
    try {
      updateState({ loading: true });
      
      const product = await handleApiCall(apiService.getProductById(id));
      
      updateState({ 
        product,
        loading: false 
      });
      
      return product;
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      updateState({ 
        error: errorMessage,
        loading: false 
      });
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Fetch featured products
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      updateState({ loading: true });
      
      const data = await handleApiCall(
        apiService.getProducts({ 
          featured: true,
          limit: 4 
        })
      );
      
      updateState({ 
        featuredProducts: data.products,
        loading: false 
      });
      
      return data.products;
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      updateState({ 
        error: errorMessage,
        loading: false 
      });
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Search products
  const searchProducts = useCallback(async (query) => {
    try {
      updateState({ 
        loading: true,
        searchQuery: query 
      });
      
      const data = await handleApiCall(
        apiService.searchProducts({ 
          q: query,
          limit: 12 
        })
      );
      
      updateState({
        products: data.products,
        currentPage: 1,
        totalPages: data.totalPages,
        totalItems: data.totalItems,
        loading: false,
      });
      
      return data.products;
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      updateState({ 
        error: errorMessage,
        loading: false 
      });
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Update sort order
  const updateSort = useCallback((sortBy) => {
    setState(prev => ({
      ...prev,
      sortBy,
      currentPage: 1
    }));
    
    // Fetch products with new sort
    fetchProducts(1, { 
      sortBy,
      filters: state.filters,
      skipLoading: true 
    });
  }, [fetchProducts, state.filters]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setState(prev => {
      // Merge new filters with existing ones
      const mergedFilters = { 
        ...prev.filters, 
        ...newFilters 
      };
      
      // Fetch products with new filters
      fetchProducts(1, { 
        filters: mergedFilters,
        sortBy: prev.sortBy,
        skipLoading: true 
      });
      
      return {
        ...prev,
        filters: mergedFilters,
        currentPage: 1,
        loading: true
      };
    });
  }, [fetchProducts]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const defaultFilters = {
      category: '',
      priceRange: [0, 1000],
      inStock: false,
      rating: 0,
    };
    
    setState(prev => ({
      ...prev,
      filters: defaultFilters,
      sortBy: 'newest',
      searchQuery: '',
      currentPage: 1,
      loading: true
    }));
    
    // Fetch products with default filters
    fetchProducts(1, { 
      filters: defaultFilters,
      sortBy: 'newest',
      skipLoading: true
    });
  }, [fetchProducts]);
  
  // Memoize the context value - single source of truth
  const contextValue = useMemo(() => ({
    products: state.products || [],
    featuredProducts: state.featuredProducts || [],
    product: state.product,
    loading: state.loading,
    error: state.error,
    currentPage: state.currentPage || 1,
    totalPages: state.totalPages || 1,
    totalItems: state.totalItems || 0,
    filters: state.filters || {},
    sortBy: state.sortBy || 'newest',
    searchQuery: state.searchQuery || '',
    fetchProducts,
    fetchProductById,
    fetchFeaturedProducts,
    searchProducts,
    updateFilters,
    updateSort,
    clearFilters,
  }), [
    state.products,
    state.featuredProducts,
    state.product,
    state.loading,
    state.error,
    state.currentPage,
    state.totalPages,
    state.totalItems,
    state.filters,
    state.sortBy,
    state.searchQuery,
    fetchProducts,
    fetchProductById,
    fetchFeaturedProducts,
    searchProducts,
    updateFilters,
    updateSort,
    clearFilters,
  ]);

  return (
    <ProductsContext.Provider value={contextValue}>
      {children}
    </ProductsContext.Provider>
  );
};

// Custom hook to use the products context
export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

export default ProductsContext;
