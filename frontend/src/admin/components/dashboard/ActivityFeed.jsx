import { FiShoppingBag, FiUser, FiPackage, FiDollarSign, FiAlertCircle } from 'react-icons/fi';

const activityIcons = {
  order: <FiShoppingBag className="h-4 w-4 text-emerald-500" />,
  user: <FiUser className="h-4 w-4 text-blue-500" />,
  product: <FiPackage className="h-4 w-4 text-amber-500" />,
  payment: <FiDollarSign className="h-4 w-4 text-green-500" />,
  alert: <FiAlertCircle className="h-4 w-4 text-red-500" />,
};

const ActivityFeed = () => {
  // Sample data - replace with real data from your API
  const activities = [
    {
      id: 1,
      type: 'order',
      title: 'New order received',
      description: 'Order #1234 has been placed',
      time: '2 minutes ago',
    },
    {
      id: 2,
      type: 'user',
      title: 'New customer registered',
      description: 'John Doe created an account',
      time: '1 hour ago',
    },
    {
      id: 3,
      type: 'product',
      title: 'Low stock alert',
      description: 'Only 5 units left of Wireless Earbuds',
      time: '3 hours ago',
    },
    {
      id: 4,
      type: 'payment',
      title: 'Payment received',
      description: 'Payment of $125.99 for order #1234',
      time: '5 hours ago',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
        <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
          View all
        </button>
      </div>
      <div className="flow-root">
        <ul className="-mb-8">
          {activities.map((activity, activityIdx) => (
            <li key={activity.id}>
              <div className="relative pb-8">
                {activityIdx !== activities.length - 1 ? (
                  <span 
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" 
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      {activityIcons[activity.type]}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {activity.title}{' '}
                        <span className="font-medium text-gray-500">{activity.description}</span>
                      </p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      {activity.time}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ActivityFeed;
