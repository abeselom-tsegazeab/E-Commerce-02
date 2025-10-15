import { Bar } from 'react-chartjs-2';
import { FiPackage, FiStar, FiTrendingUp, FiAlertTriangle } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProductPerformance = ({ dateRange, detailed = false }) => {
  // Mock data - replace with actual API call
  const topProducts = [
    { id: 1, name: 'Wireless Headphones', sales: 124, revenue: 3720, stock: 42, rating: 4.8 },
    { id: 2, name: 'Smart Watch', sales: 98, revenue: 4900, stock: 15, rating: 4.6 },
    { id: 3, name: 'Bluetooth Speaker', sales: 76, revenue: 2280, stock: 8, rating: 4.5 },
    { id: 4, name: 'USB-C Cable', sales: 210, revenue: 1050, stock: 0, rating: 4.2 },
    { id: 5, name: 'Phone Case', sales: 156, revenue: 1560, stock: 23, rating: 4.3 },
  ];

  const chartData = {
    labels: topProducts.map(product => product.name),
    datasets: [
      {
        label: 'Sales',
        data: topProducts.map(product => product.sales),
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
      },
      {
        label: 'Revenue ($)',
        data: topProducts.map(product => product.revenue / 50), // Scale down for better visualization
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label === 'Revenue ($)') {
              const value = context.raw * 50; // Scale back up for display
              return `${label}: $${value.toLocaleString()}`;
            }
            return `${label}: ${context.raw}`;
          }
        }
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Number of Sales',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Revenue ($)',
        },
        ticks: {
          callback: function(value) {
            return `$${value * 50}`; // Scale back up for display
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Product Performance
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Top selling products and inventory status
        </p>
      </div>

      <div className="h-80 mb-6">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Sales
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Revenue
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Stock
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Rating
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {topProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {product.name}
                    {product.stock === 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Out of Stock
                      </span>
                    )}
                    {product.stock > 0 && product.stock < 10 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Low Stock
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{product.sales}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">${product.revenue.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {product.stock} units
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiStar className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-900 dark:text-white">{product.rating}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailed && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300">
                <FiTrendingUp className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Top Selling Product</p>
                <p className="text-lg font-semibold text-blue-900 dark:text-white">Wireless Headphones</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">124 units sold</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300">
                <FiStar className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Highest Rated</p>
                <p className="text-lg font-semibold text-green-900 dark:text-white">Wireless Headphones</p>
                <p className="text-sm text-green-700 dark:text-green-300">4.8/5.0 rating</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-300">
                <FiAlertTriangle className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Restock Needed</p>
                <p className="text-lg font-semibold text-yellow-900 dark:text-white">USB-C Cable</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Out of stock</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPerformance;
