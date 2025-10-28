import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCategories } from '../../contexts/CategoriesContext';
import { useProducts } from '../../contexts/ProductsContext';

// Color options for filtering
const colors = [
  { id: 'white', name: 'White', class: 'bg-white' },
  { id: 'black', name: 'Black', class: 'bg-gray-900' },
  { id: 'red', name: 'Red', class: 'bg-red-500' },
  { id: 'blue', name: 'Blue', class: 'bg-blue-500' },
  { id: 'green', name: 'Green', class: 'bg-green-500' },
];

// Price ranges for the price filter
const priceRanges = [
  { id: '0-50', name: 'Under $50', min: 0, max: 50 },
  { id: '50-100', name: '$50 - $100', min: 50, max: 100 },
  { id: '100-200', name: '$100 - $200', min: 100, max: 200 },
  { id: '200-500', name: '$200 - $500', min: 200, max: 500 },
  { id: '500-1000', name: '$500 - $1000', min: 500, max: 1000 },
  { id: '1000+', name: 'Over $1000', min: 1000, max: 1000000 },
];

const ProductFilters = () => {
  const { categories, loading: categoriesLoading } = useCategories();
  const { filters, updateFilters, clearFilters } = useProducts();

  const handleCategoryChange = (categoryId) => {
    updateFilters({ 
      category: categoryId === filters.category ? '' : categoryId,
      page: 1 // Reset to first page when changing categories
    });
  };

  const handleColorChange = (colorId) => {
    const currentColors = filters.colors ? (Array.isArray(filters.colors) ? filters.colors : filters.colors.split(',')) : [];
    const newColors = currentColors.includes(colorId)
      ? currentColors.filter((c) => c !== colorId)
      : [...currentColors, colorId];
    
    updateFilters({ 
      colors: newColors,
      page: 1 // Reset to first page when changing colors
    });
  };

  const handlePriceRangeChange = (min, max) => {
    updateFilters({ 
      priceRange: [min, max],
      page: 1 // Reset to first page when changing price range
    });
  };

  const handleInStockChange = (e) => {
    updateFilters({ 
      inStock: e.target.checked,
      page: 1 // Reset to first page when changing stock filter
    });
  };

  const handleRatingChange = (rating) => {
    updateFilters({ 
      rating,
      page: 1 // Reset to first page when changing rating filter
    });
  };

  const handlePricePreset = (min, max) => {
    updateFilters({
      priceRange: [min, max],
      page: 1
    });
  };

  const hasActiveFilters = 
    filters.category || 
    (filters.colors && filters.colors.length > 0) ||
    (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000)) ||
    filters.inStock ||
    (filters.rating && filters.rating > 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear all
          </button>
        )}
      </div>

        {/* Categories */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
          {categoriesLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <div key={category._id} className="flex items-center">
                  <input
                    id={`category-${category._id}`}
                    name="category"
                    type="radio"
                    className="h-4 w-4 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                    checked={filters.category === category._id}
                    onChange={() => handleCategoryChange(category._id)}
                  />
                  <label
                    htmlFor={`category-${category._id}`}
                    className="ml-3 text-sm text-gray-600"
                  >
                    {category.name}
                    {category.productCount && (
                      <span className="text-gray-400 ml-1">({category.productCount})</span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Colors */}
      <div className="border-b border-gray-200 py-6">
        <h4 className="font-medium text-gray-900 mb-3">Color</h4>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <div key={color.id} className="flex items-center">
              <input
                id={`color-${color.id}`}
                name="color"
                type="checkbox"
                className="sr-only"
                checked={filters.colors?.includes(color.id)}
                onChange={() => handleColorChange(color.id)}
              />
              <label
                htmlFor={`color-${color.id}`}
                className="relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 focus:outline-none"
              >
                <span className="sr-only">{color.name}</span>
                <span
                  className={`h-6 w-6 rounded-full border border-gray-200 ${color.class} ${
                    filters.colors?.includes(color.id) ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                  }`}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="border-b border-gray-200 py-6">
        <h4 className="font-medium text-gray-900 mb-3">Price range</h4>
        <div className="space-y-4">
          {/* Price range presets */}
          <div className="grid grid-cols-2 gap-2">
            {priceRanges.map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => handlePricePreset(range.min, range.max)}
                className={`text-xs px-2 py-1 rounded border ${
                  filters.minPrice === range.min && filters.maxPrice === range.max
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range.name}
              </button>
            ))}
          </div>
            
          {/* Custom price range slider */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">
                ${filters.minPrice || 0}
              </div>
              <div className="text-sm text-gray-500">
                ${filters.maxPrice || 1000}
              </div>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={filters.priceRange ? filters.priceRange[0] : 0}
                onChange={(e) =>
                  handlePriceRangeChange(
                    parseInt(e.target.value, 10),
                    filters.priceRange ? filters.priceRange[1] : 1000
                  )
                }
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={filters.priceRange ? filters.priceRange[1] : 1000}
                onChange={(e) =>
                  handlePriceRangeChange(
                    filters.priceRange ? filters.priceRange[0] : 0,
                    parseInt(e.target.value, 10)
                  )
                }
                className="absolute top-0 w-full opacity-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* In Stock */}
      <div className="border-b border-gray-200 py-6">
        <h4 className="font-medium text-gray-900 mb-3">Availability</h4>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              id="in-stock"
              name="in-stock"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={!!filters.inStock}
              onChange={handleInStockChange}
            />
            <label
              htmlFor="in-stock"
              className="ml-3 text-sm text-gray-600"
            >
              In stock only
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="on-sale"
              name="on-sale"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={!!filters.onSale}
              onChange={(e) => updateFilters({ onSale: e.target.checked, page: 1 })}
            />
            <label
              htmlFor="on-sale"
              className="ml-3 text-sm text-gray-600"
            >
              On Sale
            </label>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="py-6">
        <h4 className="font-medium text-gray-900 mb-3">Rating</h4>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center">
              <input
                id={`rating-${rating}`}
                name="rating"
                type="radio"
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={filters.minRating === rating}
                onChange={() => handleRatingChange(rating)}
              />
              <label
                htmlFor={`rating-${rating}`}
                className="ml-3 text-sm text-gray-600 flex items-center"
              >
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                {rating < 5 && <span className="ml-1">&amp; up</span>}
              </label>
              <label
                htmlFor={`rating-${rating}`}
                className="ml-3 text-sm text-gray-600 flex items-center"
              >
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-4 w-4 flex-shrink-0 ${
                      i < rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-1">& Up</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
