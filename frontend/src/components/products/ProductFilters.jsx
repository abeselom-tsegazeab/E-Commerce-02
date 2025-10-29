import { XMarkIcon, FunnelIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import { useCategories } from '../../contexts/CategoriesContext';
import { useProducts } from '../../contexts/ProductsContext';
import { useEffect } from 'react';
import { useState } from 'react';
import clsx from 'clsx';

// Color options for filtering
const colors = [
  { id: 'white', name: 'White', class: 'bg-white border border-gray-200' },
  { id: 'black', name: 'Black', class: 'bg-gray-900' },
  { id: 'red', name: 'Red', class: 'bg-red-500' },
  { id: 'blue', name: 'Blue', class: 'bg-blue-500' },
  { id: 'green', name: 'Green', class: 'bg-green-500' },
  { id: 'yellow', name: 'Yellow', class: 'bg-yellow-400' },
  { id: 'purple', name: 'Purple', class: 'bg-purple-500' },
  { id: 'pink', name: 'Pink', class: 'bg-pink-400' },
].map(color => ({
  ...color,
  textColor: color.id === 'black' || color.id === 'blue' ? 'text-white' : 'text-gray-900'
}));

// Rating options
const ratings = [4, 3, 2, 1];

const FilterSection = ({ title, children, isOpen = true, onToggle }) => (
  <div className="border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50/50">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-4 py-3 text-left focus:outline-none group"
    >
      <span className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
        {title}
      </span>
      <ChevronDownIcon 
        className={clsx(
          'h-4 w-4 text-gray-400 transition-all duration-200',
          isOpen ? 'transform rotate-180' : ''
        )} 
      />
    </button>
    <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
      <div className="px-4 pb-4 pt-1">
        {children}
      </div>
    </div>
  </div>
);

const ProductFilters = () => {
  const { categories, loading: categoriesLoading } = useCategories();
  const { filters, updateFilters, clearFilters } = useProducts();
  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
    colors: true,
    rating: true,
    stock: true
  });
  
  const [priceRange, setPriceRange] = useState(filters.priceRange || [0, 1000]);
  const [isPriceChanged, setIsPriceChanged] = useState(false);

  // Sync local priceRange state with filters from context
  useEffect(() => {
    if (filters.priceRange) {
      setPriceRange(filters.priceRange);
    } else {
      setPriceRange([0, 1000]);
    }
    setIsPriceChanged(false);
  }, [filters.priceRange]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCategoryChange = (categoryId) => {
    updateFilters({ 
      category: categoryId === filters.category ? '' : categoryId,
      page: 1
    });
  };

  const handleColorChange = (colorId) => {
    const currentColors = filters.colors ? (Array.isArray(filters.colors) ? filters.colors : filters.colors.split(',')) : [];
    const newColors = currentColors.includes(colorId)
      ? currentColors.filter((c) => c !== colorId)
      : [...currentColors, colorId];
    
    updateFilters({ 
      colors: newColors,
      page: 1
    });
  };

  const handleInStockChange = (e) => {
    updateFilters({ 
      inStock: e.target.checked,
      page: 1
    });
  };

  const handleRatingChange = (rating) => {
    updateFilters({ 
      rating: filters.rating === rating ? 0 : rating,
      page: 1
    });
  };

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
    setIsPriceChanged(true);
  };

  const applyPriceFilter = () => {
    updateFilters({ 
      priceRange: priceRange,
      page: 1 
    });
    setIsPriceChanged(false);
  };

  const hasActiveFilters = 
    filters.category || 
    (filters.colors && filters.colors.length > 0) ||
    filters.inStock ||
    (filters.rating && filters.rating > 0) ||
    (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center">
            <FunnelIcon className="h-4 w-4 text-indigo-600 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                Active
              </span>
            )}
          </h3>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center transition-colors group"
            >
              <span className="group-hover:underline decoration-1 underline-offset-2">
                Clear all
              </span>
              <XMarkIcon className="h-4 w-4 ml-1.5" />
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Categories */}
        <FilterSection 
          title="Categories" 
          isOpen={openSections.categories}
          onToggle={() => toggleSection('categories')}
        >
          {categoriesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-gray-100 rounded-md animate-pulse w-full"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 -mx-1">
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.map((category) => (
                  <div key={category._id} className="group">
                    <input
                      id={`category-${category._id}`}
                      name="category"
                      type="radio"
                      className="sr-only peer"
                      checked={Boolean(filters.category === category._id)}
                      onChange={() => handleCategoryChange(category._id)}
                    />
                    <label
                      htmlFor={`category-${category._id}`}
                      className={clsx(
                        'flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors',
                        'hover:bg-gray-50 peer-checked:bg-indigo-50 peer-checked:text-indigo-700',
                        'text-gray-700 hover:text-gray-900'
                      )}
                    >
                      <span className="truncate">{category.name}</span>
                      {category.productCount && (
                        <span className="ml-2 text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 min-w-[24px] text-center">
                          {category.productCount}
                        </span>
                      )}
                    </label>
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-gray-500">No categories available</p>
              )}
            </div>
          )}
        </FilterSection>

        {/* Price Range */}
        <FilterSection 
          title="Price Range" 
          isOpen={openSections.price}
          onToggle={() => toggleSection('price')}
        >
          <div className="space-y-4">
            <div className="relative pt-6">
              <Box sx={{ width: '100%', px: 1, py: 1 }}>
                <Slider
                  value={priceRange}
                  onChange={handlePriceChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={1000}
                  step={10}
                  disableSwap
                  sx={{
                    color: '#6366f1',
                    height: 4,
                    '& .MuiSlider-rail': {
                      backgroundColor: '#e5e7eb',
                      opacity: 1,
                    },
                    '& .MuiSlider-track': {
                      border: 'none',
                      height: 4,
                    },
                    '& .MuiSlider-thumb': {
                      width: 16,
                      height: 16,
                      backgroundColor: '#fff',
                      border: '2px solid currentColor',
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 0 6px rgba(99, 102, 241, 0.1)',
                      },
                      '&.Mui-active': {
                        boxShadow: '0 0 0 10px rgba(99, 102, 241, 0.1)',
                      },
                    },
                    '& .MuiSlider-valueLabel': {
                      backgroundColor: '#4f46e5',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      '&:before': {
                        display: 'none',
                      },
                    },
                  }}
                />
              </Box>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="min-price" className="block text-xs font-medium text-gray-500 mb-1.5">
                    Min price
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="min-price"
                      id="min-price"
                      className="block w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      min="0"
                      max={priceRange[1] - 10}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="max-price" className="block text-xs font-medium text-gray-500 mb-1.5">
                    Max price
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="max-price"
                      id="max-price"
                      className="block w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Math.max(priceRange[0] + 10, parseInt(e.target.value) || 0)])}
                      min={priceRange[0] + 10}
                      max="1000"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                {isPriceChanged ? (
                  <button
                    type="button"
                    onClick={applyPriceFilter}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Apply Price Range
                  </button>
                ) : filters.priceRange ? (
                  <div className="w-full flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      ${filters.priceRange[0]} - ${filters.priceRange[1]}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPriceRange([0, 1000]);
                        updateFilters({ priceRange: null });
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-500 font-medium flex items-center"
                    >
                      Reset
                      <XMarkIcon className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Colors */}
        <FilterSection 
          title="Colors" 
          isOpen={openSections.colors}
          onToggle={() => toggleSection('colors')}
        >
          <div className="grid grid-cols-5 gap-3">
            {colors.map((color) => {
              const isSelected = filters.colors?.includes(color.id);
              return (
                <div key={color.id} className="flex flex-col items-center group">
                  <input
                    id={`color-${color.id}`}
                    name="color"
                    type="checkbox"
                    className="sr-only"
                    checked={Boolean(isSelected)}
                    onChange={() => handleColorChange(color.id)}
                  />
                  <label
                    htmlFor={`color-${color.id}`}
                    className={clsx(
                      'relative w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all',
                      'transform hover:scale-110 hover:shadow-md',
                      color.class,
                      isSelected 
                        ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-md' 
                        : 'hover:ring-1 hover:ring-gray-300'
                    )}
                    title={color.name}
                  >
                    {isSelected && (
                      <CheckIcon className="h-3.5 w-3.5" />
                    )}
                  </label>
                  <span className={clsx(
                    'mt-1.5 text-[10px] font-medium truncate w-full text-center',
                    isSelected ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'
                  )}>
                    {color.name}
                  </span>
                </div>
              );
            })}
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection 
          title="Rating" 
          isOpen={openSections.rating}
          onToggle={() => toggleSection('rating')}
        >
          <div className="space-y-2">
            {ratings.map((rating) => {
              const isSelected = filters.rating === rating;
              return (
                <div key={rating} className="group">
                  <input
                    id={`rating-${rating}`}
                    name="rating"
                    type="radio"
                    className="sr-only peer"
                    checked={Boolean(isSelected)}
                    onChange={() => handleRatingChange(rating)}
                  />
                  <label
                    htmlFor={`rating-${rating}`}
                    className={clsx(
                      'flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors',
                      'hover:bg-gray-50 peer-checked:bg-indigo-50',
                      isSelected ? 'text-indigo-700' : 'text-gray-700'
                    )}
                  >
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={clsx(
                            'h-4 w-4',
                            i < rating 
                              ? isSelected ? 'text-yellow-500' : 'text-yellow-400' 
                              : 'text-gray-300'
                          )}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className={clsx(
                      'ml-2 text-xs font-medium',
                      isSelected ? 'text-indigo-700' : 'text-gray-500 group-hover:text-gray-700'
                    )}>
                      &amp; Up
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </FilterSection>

        {/* In Stock */}
        <FilterSection 
          title="Availability" 
          isOpen={openSections.stock}
          onToggle={() => toggleSection('stock')}
        >
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="in-stock"
                name="in-stock"
                type="checkbox"
                className={clsx(
                  'h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500',
                  'transition-colors cursor-pointer'
                )}
                checked={Boolean(filters.inStock)}
                onChange={handleInStockChange}
              />
            </div>
            <label
              htmlFor="in-stock"
              className={clsx(
                'ml-3 text-sm cursor-pointer transition-colors',
                filters.inStock ? 'text-gray-900 font-medium' : 'text-gray-700 hover:text-gray-900'
              )}
            >
              In stock only
              <p className="text-xs text-gray-500 mt-0.5 font-normal">Only show products in stock</p>
            </label>
          </div>
        </FilterSection>
      </div>
    </div>
  );
};

export default ProductFilters;
