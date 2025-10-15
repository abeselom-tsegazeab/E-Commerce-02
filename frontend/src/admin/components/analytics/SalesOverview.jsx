import { FiDollarSign, FiShoppingBag, FiTrendingUp, FiUsers } from 'react-icons/fi';

const SalesOverview = ({ dateRange }) => {
  // Mock data - replace with actual API call
  const stats = [
    {
      name: 'Total Revenue',
      value: '$24,780',
      change: '+12.5%',
      changeType: 'increase',
      icon: FiDollarSign,
    },
    {
      name: 'Total Orders',
      value: '1,429',
      change: '+8.2%',
      changeType: 'increase',
      icon: FiShoppingBag,
    },
    {
      name: 'Avg. Order Value',
      value: '$68.21',
      change: '+2.1%',
      changeType: 'increase',
      icon: FiTrendingUp,
    },
    {
      name: 'Conversion Rate',
      value: '3.42%',
      change: '-0.5%',
      changeType: 'decrease',
      icon: FiUsers,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon
                  className={`h-6 w-6 ${
                    stat.changeType === 'increase'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <span
                className={`${
                  stat.changeType === 'increase'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                } font-medium`}
              >
                {stat.change}
              </span>{' '}
              <span className="text-gray-500 dark:text-gray-400">
                vs previous period
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SalesOverview;
