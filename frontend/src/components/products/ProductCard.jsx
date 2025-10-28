import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { formatCurrency } from '../../utils/format';
import { StarIcon, ShoppingCartIcon, HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product._id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, 1);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    toggleWishlist(product);
  };

  return (
    <Link 
      to={`/products/${product._id}`}
      className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
    >
      {/* Product Image */}
      <div className="relative pt-[100%] bg-gray-100">
        <img
          src={product.images?.[0] || '/images/placeholder-product.jpg'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity"
        />
        
        {/* Wishlist button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isWishlisted ? (
            <HeartIconSolid className="w-5 h-5 text-red-500" />
          ) : (
            <HeartIconOutline className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {/* Sale/New badge */}
        {product.onSale && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
            SALE
          </span>
        )}
        {product.isNew && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
            NEW
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[0, 1, 2, 3, 4].map((rating) => (
              <StarIcon
                key={rating}
                className={`${
                  product.rating > rating ? 'text-yellow-400' : 'text-gray-300'
                } h-4 w-4 flex-shrink-0`}
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">
            ({product.reviewCount || 0})
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-center">
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(product.price)}
            </p>
            {product.originalPrice && (
              <p className="ml-2 text-sm text-gray-500 line-through">
                {formatCurrency(product.originalPrice)}
              </p>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="mt-3 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ShoppingCartIcon className="w-4 h-4 mr-2" />
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
