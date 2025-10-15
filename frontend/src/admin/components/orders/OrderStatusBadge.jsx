import { FiCheck, FiClock, FiX, FiTruck, FiPackage, FiDollarSign } from 'react-icons/fi';

const statusConfig = {
  pending: {
    icon: <FiClock className="h-3 w-3 mr-1" />,
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-200',
    border: 'border-yellow-200 dark:border-yellow-800',
    label: 'Pending'
  },
  processing: {
    icon: <FiPackage className="h-3 w-3 mr-1" />,
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-800',
    label: 'Processing'
  },
  shipped: {
    icon: <FiTruck className="h-3 w-3 mr-1" />,
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    text: 'text-indigo-800 dark:text-indigo-200',
    border: 'border-indigo-200 dark:border-indigo-800',
    label: 'Shipped'
  },
  delivered: {
    icon: <FiCheck className="h-3 w-3 mr-1" />,
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-200',
    border: 'border-green-200 dark:border-green-800',
    label: 'Delivered'
  },
  cancelled: {
    icon: <FiX className="h-3 w-3 mr-1" />,
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-200',
    border: 'border-red-200 dark:border-red-800',
    label: 'Cancelled'
  },
  refunded: {
    icon: <FiDollarSign className="h-3 w-3 mr-1" />,
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-200',
    border: 'border-purple-200 dark:border-purple-800',
    label: 'Refunded'
  }
};

const OrderStatusBadge = ({ status, className = '' }) => {
  const config = statusConfig[status] || {
    icon: <FiClock className="h-3 w-3 mr-1" />,
    bg: 'bg-gray-50 dark:bg-gray-900/30',
    text: 'text-gray-800 dark:text-gray-200',
    border: 'border-gray-200 dark:border-gray-800',
    label: status || 'Unknown'
  };

  return (
    <div
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border} ${className}`}
    >
      {config.icon}
      {config.label}
    </div>
  );
};

export default OrderStatusBadge;
