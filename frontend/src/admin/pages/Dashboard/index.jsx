import { useState } from 'react';
import { FiActivity } from 'react-icons/fi';
import QuickStats from '../../components/dashboard/QuickStats';
import SalesChart from '../../components/dashboard/SalesChart';
import RecentOrders from '../../components/dashboard/RecentOrders';
import TopProducts from '../../components/dashboard/TopProducts';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import FixedDateRangeSelector from '../../components/common/FixedDateRangeSelector';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDateRangeChange = ({ range, start, end }) => {
    console.log('Date range selected:', { range, start, end });
    // Simulate loading data
    setIsLoading(true);
    
    // In a real app, you would fetch data here based on the selected date range
    // Example:
    // fetchDashboardData(start, end).then(() => {
    //   setIsLoading(false);
    // });
    
    // For now, just simulate a delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center">
          <FixedDateRangeSelector 
            onDateRangeChange={handleDateRangeChange} 
            defaultRange="Last 30 days"
          />
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              <span className="text-gray-700 dark:text-gray-200">Updating dashboard...</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <QuickStats />

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              
              <div className="w-full h-[400px] overflow-hidden">
                <SalesChart height="100%" />
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-1">
            <RecentOrders />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Products */}
          <div className="lg:col-span-2">
            <TopProducts />
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
