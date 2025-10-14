import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiTrash2, FiEye, FiEyeOff, FiCopy } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useHotkeys } from 'react-hotkeys-hook';
import ProductsFilter from '../../components/products/ProductsFilter';
import ProductsTable from '../../components/products/ProductsTable';
import ProductsPagination from '../../components/products/ProductsPagination';
import BulkActions from '../../components/products/BulkActions';
import QuickViewModal from '../../components/products/QuickViewModal';

// Mock data - replace with actual API calls
const mockCategories = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'wearables', name: 'Wearables' },
  { id: 'audio', name: 'Audio' },
  { id: 'computers', name: 'Computers' },
  { id: 'phones', name: 'Phones & Accessories' },
  { id: 'home', name: 'Home & Kitchen' },
];

const mockProducts = [
  {
    id: '1',
    name: 'Wireless Headphones',
    sku: 'WH-001',
    category: 'Electronics',
    price: 199.99,
    stock: 45,
    status: 'published',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aGVhZHBob25lc3xlbnwwfHwwfHx8MA%3D%3D',
    dateAdded: '2023-05-15',
  },
  // ... rest of your mock products
];

const Products = () => {
  // State for products and loading
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const navigate = useNavigate();
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Add keyboard shortcuts
  useHotkeys('esc', () => {
    setQuickViewProduct(null);
    document.activeElement.blur();
  });

  // Fetch products (replace with actual API call)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
        setTotalItems(mockProducts.length);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...products];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        product =>
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(product => product.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(product => product.category.toLowerCase() === categoryFilter);
    }

    // Apply price range filter
    if (priceRange.min) {
      result = result.filter(product => product.price >= Number(priceRange.min));
    }
    if (priceRange.max) {
      result = result.filter(product => product.price <= Number(priceRange.max));
    }

    setTotalItems(result.length);
    setFilteredProducts(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, searchQuery, statusFilter, categoryFilter, priceRange]);

  // Get current products for pagination
  const indexOfLastProduct = currentPage * pageSize;
  const indexOfFirstProduct = indexOfLastProduct - pageSize;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // Handle row selection
  const handleSelectItem = useCallback((productId) => {
    setSelectedItems(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      setSelectedItems(currentProducts.map(product => product.id));
    } else {
      setSelectedItems([]);
    }
  }, [currentProducts]);

  // Handle bulk actions
  const handleBulkAction = useCallback((action) => {
    switch (action) {
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${selectedItems.length} products?`)) {
          setProducts(prev => prev.filter(p => !selectedItems.includes(p.id)));
          toast.success(`${selectedItems.length} products deleted`);
          setSelectedItems([]);
        }
        break;
      case 'publish':
        setProducts(prev => 
          prev.map(p => 
            selectedItems.includes(p.id) ? { ...p, status: 'published' } : p
          )
        );
        toast.success(`${selectedItems.length} products published`);
        setSelectedItems([]);
        break;
      case 'unpublish':
        setProducts(prev => 
          prev.map(p => 
            selectedItems.includes(p.id) ? { ...p, status: 'draft' } : p
          )
        );
        toast.success(`${selectedItems.length} products unpublished`);
        setSelectedItems([]);
        break;
      case 'duplicate':
        const duplicatedProducts = products
          .filter(p => selectedItems.includes(p.id))
          .map(p => ({
            ...p,
            id: Math.random().toString(36).substr(2, 9),
            name: `Copy of ${p.name}`,
            sku: `${p.sku}-COPY`,
            status: 'draft'
          }));
        
        setProducts(prev => [...duplicatedProducts, ...prev]);
        toast.success(`${selectedItems.length} products duplicated`);
        setSelectedItems([]);
        break;
      default:
        break;
    }
  }, [selectedItems, products]);

  // Handle individual product actions
  const handleDeleteProduct = useCallback((productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setSelectedItems(prev => prev.filter(id => id !== productId));
    toast.success('Product deleted');
  }, []);

  const handleStatusToggle = useCallback((productId, newStatus) => {
    setProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, status: newStatus } : p)
    );
    toast.success(`Product ${newStatus === 'published' ? 'published' : 'unpublished'}`);
  }, []);

  // Handle quick view
  const handleQuickView = useCallback((product) => {
    setQuickViewProduct(product);
    window.history.pushState({}, '', `/admin/products/view/${product.id}`);
  }, []);

  // Close quick view and clean up URL
  const closeQuickView = useCallback(() => {
    setQuickViewProduct(null);
    if (window.location.pathname.includes('/view/')) {
      window.history.pushState({}, '', '/admin/products');
    }
  }, []);

  // Handle keyboard navigation in the table
  const handleKeyDown = useCallback((e, product, index) => {
    const { key } = e;
    const lastIndex = currentProducts.length - 1;
    
    switch (key) {
      case 'Enter':
        handleQuickView(product);
        break;
      case 'e':
        e.preventDefault();
        navigate(`/admin/products/edit/${product.id}`);
        break;
      case 'd':
        e.preventDefault();
        if (confirm('Are you sure you want to delete this product?')) {
          handleDeleteProduct(product.id);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (index < lastIndex) {
          const nextRow = document.getElementById(`product-row-${index + 1}`);
          nextRow?.focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) {
          const prevRow = document.getElementById(`product-row-${index - 1}`);
          prevRow?.focus();
        }
        break;
      default:
        break;
    }
  }, [currentProducts, handleDeleteProduct, handleQuickView, navigate]);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriceRange({ min: '', max: '' });
    setSelectedItems([]);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Get row props for keyboard navigation
  const getRowProps = useCallback((product, index) => ({
    id: `product-row-${index}`,
    tabIndex: 0,
    onKeyDown: (e) => handleKeyDown(e, product, index),
    className: 'focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:ring-offset-2',
    'aria-label': `Product: ${product.name}, ${product.price}, ${product.stock} in stock`,
    onClick: () => handleQuickView(product),
  }), [handleKeyDown, handleQuickView]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
   {/* Header */}
<motion.div 
  initial={{ y: -10, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
  className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700/50 shadow-sm p-4 mb-4"
>
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-gray-700">
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Products</h1>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
        <span className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          {products.filter(p => p.stock > 0).length} in stock
        </span>
        <span className="text-gray-300 dark:text-gray-600">•</span>
        <span className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
          {products.filter(p => p.stock === 0).length} out of stock
        </span>
        <span className="text-gray-300 dark:text-gray-600">•</span>
        <span className="flex items-center">
          {new Set(products.map(p => p.category)).size} categories
        </span>
        <span className="text-gray-300 dark:text-gray-600">•</span>
        <span className="flex items-center">
          {products.length} products • {products.filter(p => p.status === 'published').length} published
        </span>
      </div>
    </div>
    
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full sm:w-auto mt-2 sm:mt-0"
    >
      <Link
        to="new"
        className="inline-flex items-center justify-center w-full sm:w-auto px-3.5 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <FiPlus className="w-4 h-4 mr-1.5" />
        Add Product
      </Link>
    </motion.div>
  </div>
</motion.div>
      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800/50"
          >
            <BulkActions 
              selectedItems={selectedItems} 
              onBulkAction={handleBulkAction} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <ProductsFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        onReset={handleResetFilters}
        categories={mockCategories}
      />

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <ProductsTable 
          products={currentProducts} 
          onDelete={handleDeleteProduct}
          onStatusToggle={handleStatusToggle}
          onSelectItem={handleSelectItem}
          onSelectAll={handleSelectAll}
          selectedItems={selectedItems}
          isLoading={isLoading}
          getRowProps={getRowProps}
        />
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
       
        <ProductsPagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Quick View Modal */}
      <QuickViewModal 
        product={quickViewProduct} 
        isOpen={!!quickViewProduct} 
        onClose={closeQuickView} 
      />

      {/* Keyboard Shortcuts Help */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Keyboard Shortcuts</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <li className="flex items-center">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono mr-2">Enter</kbd>
            <span>View details</span>
          </li>
          <li className="flex items-center">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono mr-2">E</kbd>
            <span>Edit product</span>
          </li>
          <li className="flex items-center">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono mr-2">D</kbd>
            <span>Delete product</span>
          </li>
          <li className="flex items-center">
            <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono mr-2">Esc</kbd>
            <span>Close modal</span>
          </li>
        </ul>
      </div>
    </motion.div>
  );
};

export default Products;