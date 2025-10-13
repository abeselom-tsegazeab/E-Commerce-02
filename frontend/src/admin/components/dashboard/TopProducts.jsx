import { FiStar, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const TopProducts = () => {
  // Sample data - replace with real data from your API
  const products = [
    {
      id: 1,
      name: 'Wireless Earbuds',
      sales: 245,
      revenue: 3675,
      stock: 45,
      trend: 'up',
      trendValue: 12.5,
    },
    {
      id: 2,
      name: 'Smart Watch',
      sales: 189,
      revenue: 5670,
      stock: 12,
      trend: 'up',
      trendValue: 8.2,
    },
    {
      id: 3,
      name: 'Bluetooth Speaker',
      sales: 156,
      revenue: 2340,
      stock: 8,
      trend: 'down',
      trendValue: 3.2,
    },
    {
      id: 4,
      name: 'Wireless Charger',
      sales: 132,
      revenue: 1188,
      stock: 23,
      trend: 'up',
      trendValue: 5.7,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Top Products</h3>
        <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
          View all
        </button>
      </div>
      <div className="space-y-6">
        {products.map((product) => (
          <div key={product.id} className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-medium">
              {product.name.charAt(0)}
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                <div className="flex items-center">
                  {product.trend === 'up' ? (
                    <FiTrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <FiTrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs font-medium ${product.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {product.trendValue}%
                  </span>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {product.sales} sales • ${product.revenue.toLocaleString()}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  product.stock > 20 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {product.stock} in stock
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, (product.sales / 300) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProducts;
