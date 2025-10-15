import { Doughnut } from 'react-chartjs-2';
import { FiUsers, FiUserCheck, FiUserX, FiDollarSign } from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const CustomerInsights = ({ dateRange, detailed = false }) => {
  // Mock data - replace with actual API call
  const customerData = {
    newCustomers: 124,
    returningCustomers: 76,
    totalCustomers: 200,
    repeatPurchaseRate: 0.38,
    averageOrderValue: 68.21,
    customerAcquisitionCost: 42.50,
    lifetimeValue: 256.80,
  };

  const chartData = {
    labels: ['New Customers', 'Returning Customers'],
    datasets: [
      {
        data: [customerData.newCustomers, customerData.returningCustomers],
        backgroundColor: ['#4f46e5', '#10b981'],
        borderColor: ['#4f46e5', '#10b981'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          color: '#6b7280',
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '70%',
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Customer Insights
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Understand your customer base
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64">
          <Doughnut data={chartData} options={chartOptions} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
              <FiUserCheck className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Customers</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{customerData.totalCustomers.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
              <FiUsers className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">New Customers</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {customerData.newCustomers.toLocaleString()}
                <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                  +{Math.round((customerData.newCustomers / customerData.totalCustomers) * 100)}%
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
              <FiDollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Order Value</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                ${customerData.averageOrderValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {detailed && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Repeat Purchase Rate</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(customerData.repeatPurchaseRate * 100)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {customerData.returningCustomers} out of {customerData.totalCustomers} customers
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Acquisition Cost</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${customerData.customerAcquisitionCost.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Marketing spend per new customer
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Lifetime Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${customerData.lifetimeValue.toFixed(2)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              +${(customerData.lifetimeValue - customerData.customerAcquisitionCost).toFixed(2)} profit per customer
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerInsights;
