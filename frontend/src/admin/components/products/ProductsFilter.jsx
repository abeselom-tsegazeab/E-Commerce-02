import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiX, FiDollarSign } from 'react-icons/fi';

export const ProductsFilter = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  priceRange,
  setPriceRange,
  onReset,
  categories = []
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handlePriceRangeChange = (newRange) => {
    setPriceRange(prev => ({
      ...prev,
      ...newRange
    }));
  };

  return (
    <motion.div 
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700/50 shadow-sm p-3"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search - Always visible */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Toggle Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter className="h-3.5 w-3.5 mr-1.5" />
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
          
          {(statusFilter !== 'all' || categoryFilter !== 'all' || priceRange.min || priceRange.max) && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    id="status"
                    className="block w-full pl-3 pr-8 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="category"
                    className="block w-full pl-3 pr-8 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Min Price */}
              <div>
                <label htmlFor="minPrice" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Min Price
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="minPrice"
                    className="block w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Min"
                    value={priceRange.min || ''}
                    onChange={(e) => handlePriceRangeChange({ min: e.target.value })}
                  />
                </div>
              </div>

              {/* Max Price */}
              <div>
                <label htmlFor="maxPrice" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Max Price
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="maxPrice"
                    className="block w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Max"
                    value={priceRange.max || ''}
                    onChange={(e) => handlePriceRangeChange({ max: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductsFilter;