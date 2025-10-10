import { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, items: action.payload, loading: false };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item => 
          item._id === action.payload._id ? action.payload : item
        )
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item._id !== action.payload)
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    loading: true,
    error: null
  });

  const getCartItems = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data } = await axios.get('/api/cart');
      dispatch({ type: 'SET_CART', payload: data.items });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || 'Failed to load cart'
      });
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const { data } = await axios.post('/api/cart', { productId, quantity });
      dispatch({ type: 'ADD_ITEM', payload: data.item });
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      const { data } = await axios.put(`/api/cart/${itemId}`, { quantity });
      dispatch({ type: 'UPDATE_ITEM', payload: data.item });
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update cart');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await axios.delete(`/api/cart/${itemId}`);
      dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete('/api/cart');
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to clear cart');
    }
  };

  // Calculate cart total
  const cartTotal = state.items.reduce(
    (total, item) => total + (item.product.price * item.quantity),
    0
  );

  // Calculate item count
  const itemCount = state.items.reduce(
    (count, item) => count + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        ...state,
        cartTotal,
        itemCount,
        getCartItems,
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
