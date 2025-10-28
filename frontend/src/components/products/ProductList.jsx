import { useState, useEffect } from 'react';
import { useProducts } from '../../contexts/ProductsContext';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import ProductSort from './ProductSort';
import SearchBar from './SearchBar';
import Pagination from '../common/Pagination';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { FunnelIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';

const ProductList = () => {
  const {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    fetchProducts,
    searchProducts,
    updateFilters,
    updateSort,
    clearFilters,
    filters,
  } = useProducts();

  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch products on component mount and when filters/sort change
  useEffect(() => {
    fetchProducts(currentPage);
  }, [fetchProducts, currentPage, filters]);

  const handleSearch = (query) => {
    searchProducts(query);
  };

  const handlePageChange = (page) => {
    fetchProducts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && !products.length) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Our Products</h1>
        <div className="flex items-center space-x-4">
          {/* Mobile filter button - only show on small screens */}
          <div className="md:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
          
          {/* View toggle buttons - only show on small screens and up */}
          <div className="flex items-center space-x-1 border-l border-gray-200 pl-4">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Grid view"
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
              title="List view"
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <SearchBar onSearch={handleSearch} />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Mobile filters - shown as a modal/drawer */}
        <div className="md:hidden">
          {showFilters && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-screen">
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
                  onClick={() => setShowFilters(false)}
                ></div>
                <div className="relative w-4/5 max-w-sm bg-white h-full overflow-y-auto transform transition-transform duration-300 ease-in-out">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium">Filters</h2>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        aria-label="Close filters"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <ProductFilters 
                      filters={filters}
                      onFilterChange={updateFilters}
                      onClearFilters={clearFilters}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop filters - always shown on md screens and up */}
        <div className="hidden md:block w-full md:w-1/4 lg:w-1/5">
          <div className="sticky top-4">
            <ProductFilters 
              filters={filters}
              onFilterChange={updateFilters}
              onClearFilters={clearFilters}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="w-full md:w-3/4 lg:w-4/5">
          {/* Sort and results count */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <p className="text-gray-600 mb-4 sm:mb-0">
              Showing {products.length} of {totalPages * 12} products
            </p>
            <ProductSort 
              sortBy={filters.sortBy}
              onSortChange={updateSort}
            />
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div
                className={`${
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8'
                    : 'space-y-6'
                }`}
              >
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    viewMode={viewMode}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
