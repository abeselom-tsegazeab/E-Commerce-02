import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const WishlistContext = createContext({
  wishlistItems: [],
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  isInWishlist: () => false,
  clearWishlist: () => {},
  loading: false,
  error: null,
});

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Load wishlist from localStorage on initial render
  useEffect(() => {
    const loadWishlist = () => {
      try {
        const storedWishlist = localStorage.getItem('wishlist');
        if (storedWishlist) {
          setWishlistItems(JSON.parse(storedWishlist));
        }
      } catch (err) {
        console.error('Failed to load wishlist from localStorage', err);
        setError('Failed to load wishlist');
      }
    };

    loadWishlist();
  }, []);

  // Save wishlist to localStorage when it changes
  useEffect(() => {
    if (wishlistItems.length > 0) {
      localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems]);

  // Check if a product is in the wishlist
  const isInWishlist = useCallback(
    (productId) => {
      return wishlistItems.some((item) => item._id === productId);
    },
    [wishlistItems]
  );

  // Add item to wishlist
  const addToWishlist = useCallback(
    async (product) => {
      if (!isAuthenticated) {
        toast.info('Please log in to add items to your wishlist');
        return;
      }

      if (isInWishlist(product._id)) {
        toast.info('This item is already in your wishlist');
        return;
      }

      try {
        setLoading(true);
        // In a real app, you would make an API call here to add to wishlist
        // const response = await apiService.addToWishlist(product._id);
        
        setWishlistItems((prevItems) => [...prevItems, product]);
        toast.success('Added to wishlist');
      } catch (err) {
        console.error('Failed to add to wishlist', err);
        setError('Failed to add to wishlist');
        toast.error('Failed to add to wishlist');
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isInWishlist]
  );

  // Remove item from wishlist
  const removeFromWishlist = useCallback(
    async (productId) => {
      try {
        setLoading(true);
        // In a real app, you would make an API call here to remove from wishlist
        // await apiService.removeFromWishlist(productId);
        
        setWishlistItems((prevItems) =>
          prevItems.filter((item) => item._id !== productId)
        );
        toast.success('Removed from wishlist');
      } catch (err) {
        console.error('Failed to remove from wishlist', err);
        setError('Failed to remove from wishlist');
        toast.error('Failed to remove from wishlist');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Clear wishlist
  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
    localStorage.removeItem('wishlist');
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        loading,
        error,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
