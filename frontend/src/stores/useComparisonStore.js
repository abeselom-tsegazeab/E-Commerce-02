import { create } from 'zustand';
import { toast } from 'react-toastify';
import axios from '../lib/axios';

export const useComparisonStore = create((set) => ({
  comparisonItems: [],
  comparisonData: null,
  loading: false,
  error: null,

  // Add product to comparison
  addToComparison: (product) => {
    set((state) => {
      // Check if product is already in comparison
      if (state.comparisonItems.some(item => item._id === product._id)) {
        toast.info('Product is already in comparison');
        return state;
      }
      
      // Limit to 4 products
      if (state.comparisonItems.length >= 4) {
        toast.warning('You can compare up to 4 products at a time');
        return state;
      }
      
      toast.success('Product added to comparison');
      return { comparisonItems: [...state.comparisonItems, product] };
    });
  },

  // Remove product from comparison
  removeFromComparison: (productId) => {
    set((state) => ({
      comparisonItems: state.comparisonItems.filter(item => item._id !== productId)
    }));
  },

  // Clear comparison
  clearComparison: () => {
    set({ comparisonItems: [], comparisonData: null });
  },

  // Compare products
  compareProducts: async (productIds) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get('/api/compare', {
        params: {
          productIds: productIds.reduce((acc, id, index) => {
            acc[`productIds[${index}]`] = id;
            return acc;
          }, {})
        }
      });
      
      set({ 
        comparisonData: response.data.data,
        loading: false 
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to compare products';
      set({ 
        error: errorMessage,
        loading: false 
      });
      toast.error(errorMessage);
      throw error;
    }
  }
}));
