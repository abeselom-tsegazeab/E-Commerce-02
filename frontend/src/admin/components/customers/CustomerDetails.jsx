import { FiUser, FiMail, FiPhone, FiBriefcase, FiMapPin, FiClock, FiDollarSign, FiPackage } from 'react-icons/fi';
import { motion } from 'framer-motion';

const CustomerDetails = ({ customer, onClose }) => {
  if (!customer) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Customer Details
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {customer.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Customer Info */}
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column - Customer Details */}
            <div className="md:w-1/2 space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-200 font-medium">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">{customer.name}</h4>
                  <div className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      customer.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {customer.status || 'inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <FiMail className="h-5 w-5 text-gray-400" />
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{customer.email}</span>
                </div>
                
                {customer.phone && (
                  <div className="flex items-center">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{customer.phone}</span>
                  </div>
                )}
                
                {customer.company && (
                  <div className="flex items-start">
                    <FiBriefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{customer.company}</span>
                  </div>
                )}
                
                {customer.address && (
                  <div className="flex items-start">
                    <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {customer.address}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <FiClock className="h-5 w-5 text-gray-400" />
                  <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    Member since {formatDate(customer.createdAt || new Date().toISOString())}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Stats */}
            <div className="md:w-1/2 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Order Statistics</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200">
                        <FiDollarSign className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${(customer.totalSpent || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200">
                        <FiPackage className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {customer.ordersCount || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-200">
                        <FiClock className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Order Value</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${(customer.ordersCount ? (customer.totalSpent / customer.ordersCount).toFixed(2) : 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200">
                        <FiUser className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(customer.createdAt || new Date().toISOString()).split(',')[0]}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Orders Placeholder - You can implement this section with actual order data */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Recent Orders</h4>
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {customer.ordersCount > 0 
                      ? 'Recent orders will appear here' 
                      : 'No orders found for this customer'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiMail className="-ml-1 mr-2 h-5 w-5" />
            Send Email
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomerDetails;
