import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const StatCard = ({ title, value, change, isPositive, icon: Icon }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 h-full transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors duration-300 group-hover:text-gray-600 dark:group-hover:text-gray-300">
            {title}
          </p>
          <div className="flex items-end mt-1">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-200">
              {value}
            </p>
            <span className={`flex items-center ml-2 text-sm font-medium transition-colors duration-300 ${
              isPositive 
                ? 'text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300' 
                : 'text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300'
            }`}>
              {isPositive ? (
                <FiTrendingUp className="h-4 w-4 mr-1 transition-transform duration-300 group-hover:scale-110" />
              ) : (
                <FiTrendingDown className="h-4 w-4 mr-1 transition-transform duration-300 group-hover:scale-110" />
              )}
              {change}%
            </span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-all duration-300 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/40 group-hover:scale-110">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const QuickStats = () => {
  // Sample data - replace with real data from your API
  const stats = [
    {
      title: 'Total Revenue',
      value: '$24,780',
      change: 12.5,
      isPositive: true,
      icon: (props) => (
        <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: 'New Orders',
      value: '1,245',
      change: 8.2,
      isPositive: true,
      icon: (props) => (
        <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    },
    {
      title: 'Active Users',
      value: '3,456',
      change: -2.3,
      isPositive: false,
      icon: (props) => (
        <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      title: 'Conversion Rate',
      value: '3.42%',
      change: 4.1,
      isPositive: true,
      icon: (props) => (
        <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="group transition-all duration-300">
          <StatCard {...stat} />
        </div>
      ))}
    </div>
  );
};

export default QuickStats;