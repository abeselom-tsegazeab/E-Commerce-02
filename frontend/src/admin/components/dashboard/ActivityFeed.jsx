import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiShoppingCart, 
  FiUserPlus, 
  FiDollarSign, 
  FiMessageSquare,
  FiCheckCircle,
  FiClock,
  FiArrowRight
} from 'react-icons/fi';

const ActivityFeed = () => {
  // Sample activity data
  const activities = [
    {
      id: 1,
      type: 'order',
      user: 'John Doe',
      product: 'Wireless Headphones',
      time: '2 min ago',
      status: 'completed',
      amount: 99.99
    },
    {
      id: 2,
      type: 'user',
      user: 'Sarah Johnson',
      action: 'registered',
      time: '10 min ago',
      status: 'new'
    },
    {
      id: 3,
      type: 'payment',
      user: 'Mike Wilson',
      amount: 199.99,
      order: '#12345',
      time: '25 min ago',
      status: 'pending'
    },
    {
      id: 4,
      type: 'review',
      user: 'Emma Davis',
      product: 'Smart Watch Pro',
      rating: 5,
      time: '1 hour ago',
      status: 'new'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'order':
        return <FiShoppingCart className="h-4 w-4" />;
      case 'user':
        return <FiUserPlus className="h-4 w-4" />;
      case 'payment':
        return <FiDollarSign className="h-4 w-4" />;
      case 'review':
        return <FiMessageSquare className="h-4 w-4" />;
      default:
        return <FiClock className="h-4 w-4" />;
    }
  };

  const renderActivityContent = (activity) => {
    switch (activity.type) {
      case 'order':
        return (
          <div className='text-gray-500 dark:text-gray-400'>
            <span className="font-medium text-gray-900 dark:text-white">{activity.user}</span> placed an order for{' '}
            <span className="font-medium">{activity.product}</span>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-100">
              ${activity.amount.toFixed(2)} • <span className={activity.status === 'completed' ? 'text-green-600 dark:text-green-400' : ''}>
                {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
              </span>
            </div>
          </div>
        );
      case 'user':
        return (
          <div>
            <span className="font-medium text-gray-900 dark:text-white">{activity.user}</span> {activity.action} a new account
            {activity.status === 'new' && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                New
              </span>
            )}
          </div>
        );
      case 'payment':
        return (
          <div>
            Payment of <span className="font-medium">${activity.amount.toFixed(2)}</span> received from{' '}
            <span className="font-medium text-gray-900 dark:text-white">{activity.user}</span>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Order {activity.order} • <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
            </div>
          </div>
        );
      case 'review':
        return (
          <div>
            <span className="font-medium text-gray-900 dark:text-white">{activity.user}</span> left a{' '}
            <span className="text-amber-400">★ {activity.rating}.0</span> review for{' '}
            <span className="font-medium">{activity.product}</span>
          </div>
        );
      default:
        return null;
    }
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
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Latest actions in your store</p>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <FiClock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
          <AnimatePresence>
            {activities.slice(0, 4).map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200"
              >
                <div className="flex items-start space-x-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'order' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    activity.type === 'user' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                    activity.type === 'payment' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {renderActivityContent(activity)}
                    <div className="mt-1.5 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <FiClock className="h-3 w-3 mr-1" />
                      {activity.time}
                    </div>
                  </div>
                  {activity.status === 'completed' && (
                    <FiCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30 border-t border-gray-100 dark:border-gray-700/50">
        <button className="w-full group flex items-center justify-center text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
          View all activity
          <FiArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
};

export default ActivityFeed;