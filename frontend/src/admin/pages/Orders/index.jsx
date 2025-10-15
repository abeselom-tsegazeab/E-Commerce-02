import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrdersList from '../../components/orders/OrdersList';
import Pagination from '../../components/orders/Pagination';
import { motion } from 'framer-motion';

const Orders = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API call
 const [orders, setOrders] = useState([
  {
    id: 'ord_1',
    orderNumber: 'ORD-1001',
    status: 'processing',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    customer: { name: 'John Doe', email: 'john@example.com' },
    items: [{ name: 'Wireless Headphones', price: 99.99, quantity: 1 }],
    total: 99.99,
    paymentStatus: 'paid'
  },
  {
    id: 'ord_2',
    orderNumber: 'ORD-1002',
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    customer: { name: 'Jane Smith', email: 'jane@example.com' },
    items: [{ name: 'Smart Watch', price: 199.99, quantity: 1 }],
    total: 199.99,
    paymentStatus: 'pending'
  },
  {
    id: 'ord_3',
    orderNumber: 'ORD-1003',
    status: 'delivered',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    customer: { name: 'Robert Johnson', email: 'robert@example.com' },
    items: [{ name: 'Bluetooth Speaker', price: 79.99, quantity: 2 }],
    total: 159.98,
    paymentStatus: 'paid'
  },
  {
    id: 'ord_4',
    orderNumber: 'ORD-1004',
    status: 'processing',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    customer: { name: 'Emily Davis', email: 'emily@example.com' },
    items: [{ name: 'Laptop Backpack', price: 59.99, quantity: 1 }],
    total: 59.99,
    paymentStatus: 'paid'
  },
  {
    id: 'ord_5',
    orderNumber: 'ORD-1005',
    status: 'cancelled',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    customer: { name: 'Michael Brown', email: 'michael@example.com' },
    items: [{ name: 'Wireless Earbuds', price: 129.99, quantity: 1 }],
    total: 129.99,
    paymentStatus: 'refunded'
  },
  {
    id: 'ord_6',
    orderNumber: 'ORD-1006',
    status: 'processing',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    customer: { name: 'Sarah Wilson', email: 'sarah@example.com' },
    items: [
      { name: 'Fitness Tracker', price: 89.99, quantity: 1 },
      { name: 'Phone Mount', price: 19.99, quantity: 1 }
    ],
    total: 109.98,
    paymentStatus: 'paid'
  },
  {
    id: 'ord_7',
    orderNumber: 'ORD-1007',
    status: 'shipped',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    customer: { name: 'David Miller', email: 'david@example.com' },
    items: [{ name: 'External SSD 1TB', price: 149.99, quantity: 2 }],
    total: 299.98,
    paymentStatus: 'paid'
  },
  {
    id: 'ord_8',
    orderNumber: 'ORD-1008',
    status: 'delivered',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    customer: { name: 'Jennifer Lee', email: 'jennifer@example.com' },
    items: [
      { name: 'Wireless Charger', price: 34.99, quantity: 1 },
      { name: 'Screen Protector', price: 14.99, quantity: 2 }
    ],
    total: 64.97,
    paymentStatus: 'paid'
  },
  {
    id: 'ord_9',
    orderNumber: 'ORD-1009',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customer: { name: 'Daniel Kim', email: 'daniel@example.com' },
    items: [
      { name: 'Noise Cancelling Headphones', price: 299.99, quantity: 1 },
      { name: 'Carrying Case', price: 29.99, quantity: 1 }
    ],
    total: 329.98,
    paymentStatus: 'pending'
  },
  {
    id: 'ord_10',
    orderNumber: 'ORD-1010',
    status: 'processing',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    customer: { name: 'Lisa Wong', email: 'lisa@example.com' },
    items: [
      { name: 'Smart Home Hub', price: 199.99, quantity: 1 },
      { name: 'Smart Bulb 4-Pack', price: 59.99, quantity: 1 }
    ],
    total: 259.98,
    paymentStatus: 'paid'
  },
  {
    id: 'ord_11',
    orderNumber: 'ORD-1011',
    status: 'shipped',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    customer: { name: 'James Wilson', email: 'james@example.com' },
    items: [{ name: 'Gaming Mouse', price: 79.99, quantity: 1 }],
    total: 79.99,
    paymentStatus: 'paid'
  },
  {
    id: 'ord_12',
    orderNumber: 'ORD-1012',
    status: 'delivered',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    customer: { name: 'Maria Garcia', email: 'maria@example.com' },
    items: [
      { name: 'Mechanical Keyboard', price: 129.99, quantity: 1 },
      { name: 'Mouse Pad', price: 19.99, quantity: 1 }
    ],
    total: 149.98,
    paymentStatus: 'paid'
  }
]);

  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateRange: {
      start: null,
      end: null
    },
    sortBy: 'newest'
  });

  // Simulate API call
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        // Replace with actual API call
        // const response = await fetch('/api/orders');
        // const data = await response.json();
        // setOrders(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    // TODO: Implement status update
    console.log(`Updating order ${orderId} to status ${newStatus}`);
  };

  const handleNewOrder = () => {
    navigate('/admin/orders/new');
  };

  // Apply filters
  const filteredOrders = orders.filter(order => {
    if (filters.status !== 'all' && order.status !== filters.status) {
      return false;
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const orderMatches = 
        order.orderNumber.toLowerCase().includes(searchTerm) ||
        order.customer.name.toLowerCase().includes(searchTerm) ||
        order.customer.email.toLowerCase().includes(searchTerm);
      if (!orderMatches) return false;
    }
    return true;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (filters.sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (filters.sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (filters.sortBy === 'total_high') {
      return b.total - a.total;
    } else if (filters.sortBy === 'total_low') {
      return a.total - b.total;
    }
    return 0;
  });

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate order statistics
  const orderStats = {
    total: orders.length,
    pending: orders.filter(order => order.status === 'pending').length,
    processing: orders.filter(order => order.status === 'processing').length,
    completed: orders.filter(order => ['delivered', 'shipped'].includes(order.status)).length,
    revenue: orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-4 sm:px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Orders
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100">
                {orders.length} total
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleNewOrder}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <svg className="-ml-0.5 mr-1.5 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Order
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Orders */}
            <motion.div
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200 transition-colors duration-300">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
                    <motion.p 
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      {orderStats.total}
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Pending Orders */}
            <motion.div
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-200 transition-colors duration-300">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                    <motion.p 
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      {orderStats.pending}
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Processing Orders */}
            <motion.div
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 transition-colors duration-300">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Processing</p>
                    <motion.p 
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      {orderStats.processing}
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Completed Orders */}
            <motion.div
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 transition-colors duration-300">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                    <motion.p 
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      {orderStats.completed}
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Total Revenue */}
            <motion.div
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 transition-colors duration-300">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                    <motion.p 
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      ${orderStats.revenue}
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Orders List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            <OrdersList 
              orders={currentOrders}
              filters={filters}
              onFilterChange={handleFilterChange}
              onStatusUpdate={handleStatusUpdate}
              onNewOrder={handleNewOrder}
            />
           <Pagination
  currentPage={currentPage}
  itemsPerPage={ordersPerPage}
  totalItems={filteredOrders.length}
  onPageChange={handlePageChange}
  className="mt-4"
/>
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;