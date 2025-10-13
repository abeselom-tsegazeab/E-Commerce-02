import { FiDollarSign, FiShoppingCart, FiUsers, FiTrendingUp } from 'react-icons/fi';

const MetricCard = ({ title, value, change, icon: Icon, trend }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <div className="flex items-end mt-1">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
            <span className={`flex items-center ml-2 text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? (
                <FiTrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <FiTrendingUp className="h-4 w-4 mr-1 transform rotate-180" />
              )}
              {Math.abs(change)}%
            </span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const MetricsOverview = () => {
  const metrics = [
    {
      title: 'Total Revenue',
      value: '$24,780',
      change: 12.5,
      icon: FiDollarSign,
    },
    {
      title: 'Total Orders',
      value: '1,245',
      change: 8.2,
      icon: FiShoppingCart,
    },
    {
      title: 'New Customers',
      value: '342',
      change: -2.3,
      icon: FiUsers,
    },
    {
      title: 'Conversion',
      value: '3.42%',
      change: 4.1,
      icon: FiTrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default MetricsOverview;
