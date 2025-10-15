import { useState } from 'react';
import { FiFilter, FiDownload, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';
import SalesOverview from '../../components/analytics/SalesOverview';
import SalesTrends from '../../components/analytics/SalesTrends';
import CustomerInsights from '../../components/analytics/CustomerInsights';
import ProductPerformance from '../../components/analytics/ProductPerformance';
import GeographicData from '../../components/analytics/GeographicData';
import DateRangePicker from '../../../components/common/DateRangePicker';

const Analytics = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
    key: 'selection'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleDateChange = (ranges) => {
    setDateRange(ranges.selection);
    // Here you would typically refetch data with new date range
  };

  const refreshData = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

 
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track and analyze your store's performance
          </p>
        </div>
        
        <div className="mt-4 flex space-x-3 md:mt-0">
          <DateRangePicker 
            dateRange={dateRange}
            onChange={handleDateChange}
          />
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiRefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'sales', 'customers', 'products', 'geography'].map((tab) => {
            const tabNames = {
              overview: 'Overview',
              sales: 'Sales',
              customers: 'Customers',
              products: 'Products',
              geography: 'Geography'
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tabNames[tab]}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <SalesOverview dateRange={dateRange} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SalesTrends dateRange={dateRange} />
                  <CustomerInsights dateRange={dateRange} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ProductPerformance dateRange={dateRange} />
                  <GeographicData dateRange={dateRange} />
                </div>
              </div>
            )}
            
            {activeTab === 'sales' && <SalesTrends dateRange={dateRange} detailed />}
            {activeTab === 'customers' && <CustomerInsights dateRange={dateRange} detailed />}
            {activeTab === 'products' && <ProductPerformance dateRange={dateRange} detailed />}
            {activeTab === 'geography' && <GeographicData dateRange={dateRange} detailed />}
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
