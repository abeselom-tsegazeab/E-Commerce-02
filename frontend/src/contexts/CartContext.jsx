import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';
import { handleApiCall, formatErrorMessage } from '../utils/api.utils';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return { 
        ...state, 
        items: action.payload.items || [],
        loading: false,
        total: action.payload.total || 0,
        itemCount: action.payload.itemCount || 0
      };
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
        itemCount: state.itemCount + 1,
        total: state.total + (action.payload.price * action.payload.quantity)
      };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item => 
          item._id === action.payload._id ? action.payload : item
        ),
        total: state.items.reduce((sum, item) => {
          return sum + (item._id === action.payload._id 
            ? action.payload.price * action.payload.quantity
            : item.price * item.quantity);
        }, 0)
      };
    case 'REMOVE_ITEM':
      const removedItem = state.items.find(item => item._id === action.payload);
      return {
        ...state,
        items: state.items.filter(item => item._id !== action.payload),
        itemCount: state.itemCount - 1,
        total: state.total - (removedItem ? removedItem.price * removedItem.quantity : 0)
      };
    case 'CLEAR_CART':
      return { 
        ...state, 
        items: [],
        total: 0,
        itemCount: 0 
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload, 
        loading: false 
      };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    loading: true,
    error: null,
    total: 0,
    itemCount: 0
  });

  // Fetch cart from API
  const fetchCart = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const cartData = await handleApiCall(apiService.getCart());
      dispatch({ 
        type: 'SET_CART', 
        payload: {
          items: cartData.items,
          total: cartData.total,
          itemCount: cartData.itemCount
        }
      });
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      dispatch({
        type: 'SET_ERROR',
        payload: errorMessage
      });
    }
  }, []);

  const addToCart = async (product, quantity = 1) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const cartItem = await handleApiCall(
        apiService.addToCart({ productId: product._id, quantity })
      );
      
      dispatch({ 
        type: 'ADD_ITEM', 
        payload: {
          ...product,
          quantity: cartItem.quantity,
          _id: cartItem._id,
          price: cartItem.price
        }
      });
      
      toast.success('Item added to cart');
      return cartItem;
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      dispatch({
        type: 'SET_ERROR',
        payload: errorMessage
      });
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateCartItem = async (itemId, updates) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedItem = await handleApiCall(
        apiService.updateCartItem(itemId, updates)
      );
      
      dispatch({ 
        type: 'UPDATE_ITEM', 
        payload: {
          ...updatedItem,
          _id: itemId
        }
      });
      
      return updatedItem;
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      dispatch({
        type: 'SET_ERROR',
        payload: errorMessage
      });
      toast.error(errorMessage);
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await apiService.removeFromCart(itemId);
      dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await handleApiCall(apiService.clearCart());
      dispatch({ type: 'CLEAR_CART' });
      toast.success('Cart cleared');
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      dispatch({
        type: 'SET_ERROR',
        payload: errorMessage
      });
      toast.error(errorMessage);
      throw error;
    }
  };

  // Calculate cart total
  const cartTotal = state.items.reduce(
    (total, item) => total + (item.price * item.quantity),
    0
  );

  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Clear cart if user logs out
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [isAuthenticated, fetchCart]);

  return (
    <CartContext.Provider
      value={{
        ...state,
        cartTotal,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
