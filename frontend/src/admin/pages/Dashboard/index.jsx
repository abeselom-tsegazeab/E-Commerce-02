import { FiDollarSign, FiShoppingCart, FiUsers, FiPackage } from 'react-icons/fi';

const Dashboard = () => {
  // Mock data - replace with real data from your API
  const stats = [
    {
      title: 'Total Revenue',
      value: '$34,545',
      change: '+12.5%',
      icon: <FiDollarSign className="w-6 h-6 text-emerald-500" />,
      trend: 'up',
    },
    {
      title: 'Total Orders',
      value: '1,234',
      change: '+5.2%',
      icon: <FiShoppingCart className="w-6 h-6 text-blue-500" />,
      trend: 'up',
    },
    {
      title: 'Total Customers',
      value: '2,345',
      change: '+8.1%',
      icon: <FiUsers className="w-6 h-6 text-purple-500" />,
      trend: 'up',
    },
    {
      title: 'Total Products',
      value: '856',
      change: '-2.3%',
      icon: <FiPackage className="w-6 h-6 text-amber-500" />,
      trend: 'down',
    },
  ];

  const recentOrders = [
    {
      id: '#ORD-001',
      customer: 'John Doe',
      date: '2023-05-15',
      amount: '$125.99',
      status: 'Delivered',
      statusClass: 'bg-green-100 text-green-800',
    },
    {
      id: '#ORD-002',
      customer: 'Jane Smith',
      date: '2023-05-14',
      amount: '$89.50',
      status: 'Processing',
      statusClass: 'bg-blue-100 text-blue-800',
    },
    {
      id: '#ORD-003',
      customer: 'Robert Johnson',
      date: '2023-05-14',
      amount: '$235.75',
      status: 'Shipped',
      statusClass: 'bg-yellow-100 text-yellow-800',
    },
    {
      id: '#ORD-004',
      customer: 'Emily Davis',
      date: '2023-05-13',
      amount: '$67.30',
      status: 'Pending',
      statusClass: 'bg-gray-100 text-gray-800',
    },
    {
      id: '#ORD-005',
      customer: 'Michael Wilson',
      date: '2023-05-13',
      amount: '$189.99',
      status: 'Delivered',
      statusClass: 'bg-green-100 text-green-800',
    },
  ];

  const topProducts = [
    {
      id: 1,
      name: 'Wireless Earbuds',
      sales: 245,
      revenue: '$3,675',
      stock: 45,
    },
    {
      id: 2,
      name: 'Smart Watch',
      sales: 189,
      revenue: '$5,670',
      stock: 12,
    },
    {
      id: 3,
      name: 'Bluetooth Speaker',
      sales: 156,
      revenue: '$2,340',
      stock: 8,
    },
    {
      id: 4,
      name: 'Wireless Charger',
      sales: 132,
      revenue: '$1,188',
      stock: 23,
    },
    {
      id: 5,
      name: 'Laptop Backpack',
      sales: 98,
      revenue: '$2,450',
      stock: 5,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
              <div className="flex items-center mt-1">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <span
                  className={`ml-2 text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Orders</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Order ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {order.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {order.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                        {order.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.statusClass}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <a
                href="/admin/orders"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                View all orders →
              </a>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Selling Products</h3>
            <div className="space-y-4">
              {topProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.sales} sales</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{product.revenue}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.stock} in stock</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <a
                href="/admin/products"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                View all products →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
