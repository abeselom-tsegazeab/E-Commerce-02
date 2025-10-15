import { useState } from 'react';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiPlus, FiDownload } from 'react-icons/fi';
import OrdersFilter from './OrdersFilter';
import OrdersTable from './OrdersTable';
import OrderDetails from './OrderDetails';
import { format } from 'date-fns';

const OrdersList = ({ orders, filters, onFilterChange, onStatusUpdate, onNewOrder }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
  };

  // Apply filters to orders
  const filteredOrders = orders.filter(order => {
    // Filter by status
    if (filters.status !== 'all' && order.status !== filters.status) {
      return false;
    }
    
    // Filter by search query
    if (filters.search && !`${order.orderNumber} ${order.customer?.name}`.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Filter by date range
    if (filters.dateRange.start || filters.dateRange.end) {
      const orderDate = new Date(order.createdAt);
      if (filters.dateRange.start && orderDate < new Date(filters.dateRange.start)) {
        return false;
      }
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (orderDate > endDate) {
          return false;
        }
      }
    }

    return true;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (filters.sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (filters.sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (filters.sortBy === 'total-high') {
      return b.total - a.total;
    } else if (filters.sortBy === 'total-low') {
      return a.total - b.total;
    }
    return 0;
  });

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search orders..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                // Export functionality
                const dataStr = JSON.stringify(sortedOrders, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const exportName = `orders_${new Date().toISOString().split('T')[0]}.json`;
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportName);
                linkElement.click();
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiDownload className="h-4 w-4 mr-2" />
              Export
            </button>
            
            <button
              type="button"
              onClick={onNewOrder}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiPlus className="h-4 w-4 mr-2" />
              New Order
            </button>
            
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter className="h-4 w-4 mr-2" />
              Filters
              {showFilters ? (
                <FiChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <FiChevronDown className="ml-2 h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Rest of the component remains the same */}
        {showFilters && (
          <div className="mt-4">
            <OrdersFilter
              filters={filters}
              onFilterChange={onFilterChange}
            />
          </div>
        )}
      </div>

      <div>
        <OrdersTable
          orders={sortedOrders}
          onViewDetails={handleViewDetails}
          onStatusUpdate={onStatusUpdate}
        />
      </div>

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={handleCloseDetails}
          onStatusUpdate={onStatusUpdate}
        />
      )}
    </div>
  );
};

export default OrdersList;