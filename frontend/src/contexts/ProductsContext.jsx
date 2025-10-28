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
  const updateState = (updates) => {
    setState(prev => ({
      ...prev,
      ...updates,
      error: null, // Clear previous errors on new actions
    }));
  };

  // Fetch all products with pagination, filtering, and sorting
  const fetchProducts = useCallback(async (page = 1, options = {}) => {
    try {
      updateState({ loading: true });
      
      const { filters = state.filters, sortBy = state.sortBy } = options;
      const params = {
        page,
        limit: 12, // Default items per page
        ...filters,
        sort: sortBy,
      };

      const data = await handleApiCall(apiService.getProducts(params));
      
      updateState({
        products: data.products,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalItems: data.totalItems,
        loading: false,
        filters,
        sortBy,
      });
      
      return data;
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

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    const filters = { ...state.filters, ...newFilters };
    updateState({ 
      filters,
      currentPage: 1 // Reset to first page when filters change
    });
    
    // Automatically fetch products with new filters
    fetchProducts(1, { filters });
  }, [fetchProducts, state.filters]);

  // Update sort
  const updateSort = useCallback((sortBy) => {
    updateState({ sortBy });
    
    // Automatically fetch products with new sort
    fetchProducts(1, { sortBy });
  }, [fetchProducts]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const defaultFilters = {
      category: '',
      priceRange: [0, 1000],
      inStock: false,
      rating: 0,
    };
    
    updateState({ 
      filters: defaultFilters,
      sortBy: 'newest',
      searchQuery: '',
      currentPage: 1
    });
    
    // Fetch products with default filters
    fetchProducts(1, { 
      filters: defaultFilters,
      sortBy: 'newest' 
    });
  }, [fetchProducts]);

  // Memoize the context value
  const contextValue = useMemo(() => ({
    // State
    products: state.products,
    featuredProducts: state.featuredProducts,
    product: state.product,
    loading: state.loading,
    error: state.error,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalItems: state.totalItems,
    filters: state.filters,
    sortBy: state.sortBy,
    searchQuery: state.searchQuery,
    
    // Actions
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
