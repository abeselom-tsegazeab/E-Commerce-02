import { Fragment, useState, useEffect } from 'react';
import { FiPackage, FiTruck, FiCreditCard, FiUser, FiMapPin, FiMail, FiPhone, FiX } from 'react-icons/fi';
import OrderStatusBadge from './OrderStatusBadge';

const OrderDetails = ({ order, onClose, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order?.status || '');
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ];

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
      // Trigger the modal open animation
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    } else {
      setIsOpen(false);
    }
  }, [order]);

  const handleStatusUpdate = async () => {
    if (!order || selectedStatus === order.status) return;
    
    setIsUpdating(true);
    try {
      await onStatusUpdate(order.id, selectedStatus);
      onClose();
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!order) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all w-full max-w-4xl overflow-hidden ${
            isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <div className="relative p-6">
            {/* Close button */}
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none p-1"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <FiX className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Order #{order.orderNumber || 'N/A'}
                </h3>
                
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  <OrderStatusBadge status={order.status} />
                  {order.status !== selectedStatus && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400">
                      (Change pending save)
                    </span>
                  )}
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>Order placed on {formatDate(order.createdAt)}</p>
                    <p className="mt-1">Order ID: {order.id || 'N/A'}</p>
                  </div>
                  <div className="text-lg font-medium text-indigo-600 dark:text-indigo-400">
                    ${order.total?.toFixed(2) || '0.00'}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Customer Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900 dark:text-white">
                        {order.customer?.name || 'Guest'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FiMail className="h-4 w-4 text-gray-400 mr-2" />
                      {order.customer?.email ? (
                        <a 
                          href={`mailto:${order.customer.email}`} 
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {order.customer.email}
                        </a>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">No email provided</span>
                      )}
                    </div>
                    {order.customer?.phone && (
                      <div className="flex items-center text-sm">
                        <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                        <a 
                          href={`tel:${order.customer.phone}`} 
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {order.customer.phone}
                        </a>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Shipping Address
                      </h5>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {order.shippingAddress ? (
                          <>
                            <p>{order.shippingAddress.name || 'N/A'}</p>
                            {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
                            {order.shippingAddress.street2 && <p>{order.shippingAddress.street2}</p>}
                            <p>
                              {[
                                order.shippingAddress.city,
                                order.shippingAddress.state,
                                order.shippingAddress.postalCode
                              ].filter(Boolean).join(', ')}
                            </p>
                            {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                          </>
                        ) : (
                          <p>No shipping address provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                {order.items?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Order Items ({order.items.length})
                    </h4>
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {order.items.map((item) => (
                          <li key={item.id} className="p-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name || 'Product'}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/64';
                                    }}
                                  />
                                )}
                              </div>
                              <div className="ml-4 flex-1">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.name || 'Unnamed Product'}
                                  </h5>
                                  <p className="ml-4 text-sm font-medium text-gray-900 dark:text-white">
                                    ${(item.price || 0).toFixed(2)}
                                  </p>
                                </div>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  Qty: {item.quantity || 1}
                                </p>
                                {item.variants && Object.keys(item.variants).length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {Object.entries(item.variants).map(([key, value]) => (
                                      <span 
                                        key={`${key}-${value}`}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                      >
                                        {key}: {value}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Status Update */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Update Order Status
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleStatusUpdate}
                      disabled={isUpdating || selectedStatus === order.status}
                      className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        isUpdating || selectedStatus === order.status
                          ? 'bg-indigo-300 dark:bg-indigo-700 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      }`}
                    >
                      {isUpdating ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:text-sm"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
