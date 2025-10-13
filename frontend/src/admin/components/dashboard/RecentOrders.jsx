import { FiPackage, FiCheckCircle, FiClock, FiTruck, FiXCircle } from 'react-icons/fi';

const statusIcons = {
  completed: <FiCheckCircle className="text-green-500" />,
  processing: <FiClock className="text-yellow-500" />,
  shipped: <FiTruck className="text-blue-500" />,
  cancelled: <FiXCircle className="text-red-500" />,
};

const statusStyles = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const RecentOrders = () => {
  // Sample data - replace with real data from your API
  const orders = [
    {
      id: '#ORD-001',
      customer: 'John Doe',
      date: '2023-06-15',
      amount: 125.99,
      status: 'completed',
      items: 2,
    },
    {
      id: '#ORD-002',
      customer: 'Jane Smith',
      date: '2023-06-14',
      amount: 89.50,
      status: 'processing',
      items: 1,
    },
    {
      id: '#ORD-003',
      customer: 'Robert Johnson',
      date: '2023-06-14',
      amount: 235.75,
      status: 'shipped',
      items: 3,
    },
    {
      id: '#ORD-004',
      customer: 'Emily Davis',
      date: '2023-06-13',
      amount: 67.30,
      status: 'cancelled',
      items: 1,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Orders</h3>
        <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
          View all
        </button>
      </div>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 mr-4">
                <FiPackage className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{order.id}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{order.customer} • {order.items} items</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">${order.amount.toFixed(2)}</p>
              <div className="flex items-center justify-end mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.status]}`}>
                  <span className="mr-1">{statusIcons[order.status]}</span>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentOrders;
