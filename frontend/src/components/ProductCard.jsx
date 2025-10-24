import { toast } from "react-toastify";
import { ShoppingCart, BarChart2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCartStore } from "../stores/useCartStore";
import { useComparisonStore } from "../stores/useComparisonStore";

const ProductCard = ({ product, showRemoveFromComparison = false }) => {
  const { user } = useAuth();
  const { addToCart } = useCartStore();
  const { addToComparison, removeFromComparison, comparisonItems } = useComparisonStore();
  
  const isInComparison = comparisonItems.some(item => item._id === product._id);

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add products to cart", { id: "login" });
      return;
    } else {
      addToCart(product);
    }
  };

  const handleCompareClick = () => {
    if (isInComparison) {
      removeFromComparison(product._id);
      toast.success('Product removed from comparison');
    } else {
      addToComparison(product);
    }
  };

  return (
    <div className='flex w-full relative flex-col overflow-hidden rounded-lg border border-gray-700 shadow-lg'>
      {showRemoveFromComparison && (
        <button
          onClick={() => removeFromComparison(product._id)}
          className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          aria-label="Remove from comparison"
        >
          <X size={16} />
        </button>
      )}
      
      <div className='relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl'>
        <img className='object-cover w-full' src={product.image} alt={product.name} />
        <div className='absolute inset-0 bg-black bg-opacity-20' />
      </div>

      <div className='mt-4 px-5 pb-5'>
        <h5 className='text-xl font-semibold tracking-tight text-white'>{product.name}</h5>
        <div className='mt-2 mb-5 flex items-center justify-between'>
          <p>
            <span className='text-3xl font-bold text-emerald-400'>${product.price}</span>
          </p>
        </div>
        
        <div className="flex flex-col space-y-2">
          <button
            className='flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-center text-sm font-medium
            text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-colors'
            onClick={handleAddToCart}
          >
            <ShoppingCart size={18} className='mr-2' />
            Add to cart
          </button>
          
          <button
            onClick={handleCompareClick}
            className={`flex items-center justify-center rounded-lg px-5 py-2.5 text-center text-sm font-medium
            transition-colors ${
              isInComparison 
                ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-600' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <BarChart2 size={18} className='mr-2' />
            {isInComparison ? 'In Comparison' : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
