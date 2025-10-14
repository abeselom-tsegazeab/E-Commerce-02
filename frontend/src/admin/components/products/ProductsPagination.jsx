import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

const buttonVariants = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.1 }
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

export const ProductsPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  onPageSizeChange
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700/50 rounded-b-lg shadow-sm"
    >
      {/* Items per page selector */}
      <div className="mb-3 sm:mb-0">
        <div className="flex items-center">
          <label htmlFor="items-per-page" className="mr-2 text-xs font-medium text-gray-600 dark:text-gray-400">
            Rows per page:
          </label>
          <div className="relative">
            <select
              id="items-per-page"
              className="appearance-none pl-2 pr-8 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[10, 20, 30, 50, 100].map((size) => (
                <option key={size} value={size} className="dark:bg-gray-800">
                  {size}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Page info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 sm:mb-0">
        <span className="font-medium text-gray-700 dark:text-gray-300">{startItem}-{endItem}</span> of{' '}
        <span className="font-medium text-gray-700 dark:text-gray-300">{totalItems}</span>
      </div>

      {/* Pagination controls */}
      <nav className="flex items-center space-x-1">
        <motion.button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="First page"
          variants={buttonVariants}
          whileHover={currentPage === 1 ? 'disabled' : 'hover'}
          whileTap={currentPage === 1 ? 'disabled' : 'tap'}
        >
          <FiChevronsLeft className="h-4 w-4" />
        </motion.button>
        
        <motion.button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
          variants={buttonVariants}
          whileHover={currentPage === 1 ? 'disabled' : 'hover'}
          whileTap={currentPage === 1 ? 'disabled' : 'tap'}
        >
          <FiChevronLeft className="h-4 w-4" />
        </motion.button>

        <AnimatePresence initial={false}>
          {pageNumbers[0] > 1 && (
            <motion.span 
              className="px-2 py-1 text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              ...
            </motion.span>
          )}

          {pageNumbers.map((page) => (
            <motion.button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                currentPage === page
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              aria-current={currentPage === page ? 'page' : undefined}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {page}
            </motion.button>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <motion.span 
              className="px-2 py-1 text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              ...
            </motion.span>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
          variants={buttonVariants}
          whileHover={currentPage === totalPages ? 'disabled' : 'hover'}
          whileTap={currentPage === totalPages ? 'disabled' : 'tap'}
        >
          <FiChevronRight className="h-4 w-4" />
        </motion.button>
        
        <motion.button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Last page"
          variants={buttonVariants}
          whileHover={currentPage === totalPages ? 'disabled' : 'hover'}
          whileTap={currentPage === totalPages ? 'disabled' : 'tap'}
        >
          <FiChevronsRight className="h-4 w-4" />
        </motion.button>
      </nav>
    </motion.div>
  );
};

export default ProductsPagination;
