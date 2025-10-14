import { motion } from 'framer-motion';
import { 
  FiPackage, 
  FiTruck, 
  FiCheckCircle, 
  FiClock,
  FiArrowRight,
  FiDollarSign,
  FiChevronDown,
  FiChevronUp,
  FiChevronRight,
  FiXCircle
} from 'react-icons/fi';
import { useState } from 'react';

const RecentOrders = () => {
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Sample orders data
  const orders = [
    {
      id: '#ORD-001',
      customer: 'John Doe',
      email: 'john@example.com',
      date: '2023-05-28',
      status: 'shipped',
      amount: 249.98,
      items: 2,
      payment: 'Credit Card',
      products: [
        { name: 'Wireless Headphones', quantity: 1, price: 199.99 },
        { name: 'Charging Cable', quantity: 1, price: 49.99 }
      ]
    },
    {
      id: '#ORD-002',
      customer: 'Sarah Johnson',
      email: 'sarah@example.com',
      date: '2023-05-28',
      status: 'processing',
      amount: 99.99,
      items: 1,
      payment: 'PayPal',
      products: [
        { name: 'Bluetooth Speaker', quantity: 1, price: 99.99 }
      ]
    },
    {
      id: '#ORD-003',
      customer: 'Mike Wilson',
      email: 'mike@example.com',
      date: '2023-05-27',
      status: 'delivered',
      amount: 179.97,
      items: 3,
      payment: 'Credit Card',
      products: [
        { name: 'Phone Case', quantity: 2, price: 49.99 },
        { name: 'Screen Protector', quantity: 1, price: 79.99 }
      ]
    },
    {
      id: '#ORD-004',
      customer: 'Emma Davis',
      email: 'emma@example.com',
      date: '2023-05-27',
      status: 'cancelled',
      amount: 129.99,
      items: 1,
      payment: 'Bank Transfer',
      products: [
        { name: 'Wireless Earbuds', quantity: 1, price: 129.99 }
      ]
    }
  ];

  const sortedOrders = [...orders].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      processing: {
        text: 'Processing',
        icon: <FiClock className="h-3 w-3 mr-1" />,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      },
      shipped: {
        text: 'Shipped',
        icon: <FiTruck className="h-3 w-3 mr-1" />,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      },
      delivered: {
        text: 'Delivered',
        icon: <FiCheckCircle className="h-3 w-3 mr-1" />,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      },
      cancelled: {
        text: 'Cancelled',
        icon: <FiXCircle className="h-3 w-3 mr-1" />,
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      }
    };

    const { text, icon, className } = statusConfig[status] || { 
      text: status, 
      icon: null,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        {icon}
        {text}
      </span>
    );
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <FiChevronDown className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100" />;
    return sortConfig.direction === 'asc' 
      ? <FiChevronUp className="ml-1 h-3 w-3" /> 
      : <FiChevronDown className="ml-1 h-3 w-3" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700/50"
    >
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Latest customer orders</p>
          </div>
          <button className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
            View all orders
            <FiArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/30"
                onClick={() => requestSort('id')}
              >
                <div className="flex items-center group">
                  Order
                  <SortIcon column="id" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/30"
                onClick={() => requestSort('customer')}
              >
                <div className="flex items-center group">
                  Customer
                  <SortIcon column="customer" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/30"
                onClick={() => requestSort('date')}
              >
                <div className="flex items-center group">
                  Date
                  <SortIcon column="date" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/30"
                onClick={() => requestSort('amount')}
              >
                <div className="flex items-center justify-end group">
                  Amount
                  <SortIcon column="amount" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedOrders.map((order) => (
              <>
                <tr 
                  key={order.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                  onClick={() => toggleOrderDetails(order.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <FiPackage className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{order.id}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{order.items} items</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{order.customer}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{order.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                    ${order.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {getStatusBadge(order.status)}
                  </td>
                </tr>
                {expandedOrder === order.id && (
                  <tr className="bg-gray-50 dark:bg-gray-700/30">
                    <td colSpan="5" className="px-6 py-4">
                      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Order Details</h4>
                        <div className="space-y-2">
                          {order.products.map((product, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-300">
                                {product.name} ×{product.quantity}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                ${(product.price * product.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>
                          <div className="flex justify-between text-sm font-medium">
                            <span>Total</span>
                            <span>${order.amount.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Paid with {order.payment}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default RecentOrders;