import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  TimeSeriesScale
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  TimeSeriesScale
);

// Helper functions
const generateRandomData = (count, min, max) => 
  Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);

const generateTimeLabels = (period, count) => {
  const now = new Date();
  
  if (period === 'daily') {
    return Array.from({ length: count }, (_, i) => {
      const date = new Date();
      date.setDate(now.getDate() - (count - 1 - i));
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    });
  } else if (period === 'weekly') {
    return Array.from({ length: count }, (_, i) => {
      const date = new Date();
      date.setDate(now.getDate() - ((count - 1 - i) * 7));
      return `Week ${count - i}`;
    });
  } else { // monthly
    return Array.from({ length: count }, (_, i) => {
      const date = new Date();
      date.setMonth(now.getMonth() - (count - 1 - i));
      return date.toLocaleString('default', { month: 'short' });
    });
  }
};

const SalesChart = ({ 
  title = 'Sales Overview', 
  height = '300px',
  showHeader = true,
  showTimeframeSelector = true
}) => {
  const [timeframe, setTimeframe] = useState('monthly');
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      label: 'Sales',
      data: [],
      borderColor: 'rgba(16, 185, 129, 1)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      fill: true,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointBackgroundColor: 'rgba(16, 185, 129, 1)',
      pointHoverBackgroundColor: 'rgba(16, 185, 129, 1)',
    }]
  });
  
  // Generate data based on selected timeframe
  useEffect(() => {
    let data;
    
    switch(timeframe) {
      case 'daily':
        data = {
          labels: generateTimeLabels('daily', 14),
          data: generateRandomData(14, 1000, 5000),
          total: Math.floor(Math.random() * 50000) + 30000,
          growth: (Math.random() * 20 + 5).toFixed(1)
        };
        break;
      case 'weekly':
        data = {
          labels: generateTimeLabels('weekly', 12),
          data: generateRandomData(12, 5000, 20000),
          total: Math.floor(Math.random() * 150000) + 100000,
          growth: (Math.random() * 15 + 3).toFixed(1)
        };
        break;
      case 'yearly':
        const currentYear = new Date().getFullYear();
        data = {
          labels: Array.from({ length: 5 }, (_, i) => (currentYear - 4 + i).toString()),
          data: generateRandomData(5, 100000, 800000),
          total: Math.floor(Math.random() * 3000000) + 2000000,
          growth: (Math.random() * 30 + 10).toFixed(1)
        };
        break;
      case 'monthly':
      default:
        data = {
          labels: generateTimeLabels('monthly', 12),
          data: generateRandomData(12, 10000, 50000),
          total: Math.floor(Math.random() * 500000) + 300000,
          growth: (Math.random() * 25 + 5).toFixed(1)
        };
    }

    setChartData(prev => ({
      ...prev,
      labels: data.labels,
      datasets: [{
        ...prev.datasets[0],
        data: data.data
      }]
    }));
  }, [timeframe]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        callbacks: {
          label: (context) => `$${context.parsed.y.toLocaleString()}`,
          title: () => ''
        },
        displayColors: false,
        intersect: false,
        mode: 'index',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(243, 244, 246, 0.5)',
          drawBorder: false,
        },
        ticks: {
          callback: (value) => `$${value.toLocaleString()}`,
          color: '#6B7280',
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
        },
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
      point: {
        radius: 0,
        hoverRadius: 5,
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
  };

  // Calculate total and growth from current data
  const totalSales = chartData.datasets[0]?.data?.reduce((sum, val) => sum + val, 0) || 0;
  const growthRate = chartData.growth || '0.0';

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  // Get active button styles
  const getButtonClass = (btnTimeframe) => 
    `px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded whitespace-nowrap transition-colors ${
      timeframe === btnTimeframe 
        ? 'bg-emerald-500 text-white' 
        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
    }`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 w-full h-full flex flex-col">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate">{title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
                <FiDollarSign className="h-3.5 w-3.5 text-emerald-500 mr-1 flex-shrink-0" />
                <span className="truncate">Total: ${totalSales.toLocaleString()}</span>
              </span>
              <span className="inline-flex items-center text-sm text-emerald-600 dark:text-emerald-400">
                <FiTrendingUp className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                <span className="truncate">{growthRate}% from last period</span>
              </span>
            </div>
          </div>
          {showTimeframeSelector && (
            <div className="flex flex-shrink-0 space-x-1 sm:space-x-2 bg-gray-50 dark:bg-gray-700 p-0.5 sm:p-1 rounded-md">
              <button 
                onClick={() => handleTimeframeChange('yearly')}
                className={getButtonClass('yearly')}
              >
                Yearly
              </button>
              <button 
                onClick={() => handleTimeframeChange('monthly')}
                className={getButtonClass('monthly')}
              >
                Monthly
              </button>
              <button 
                onClick={() => handleTimeframeChange('weekly')}
                className={getButtonClass('weekly')}
              >
                Weekly
              </button>
              <button 
                onClick={() => handleTimeframeChange('daily')}
                className={getButtonClass('daily')}
              >
                Daily
              </button>
            </div>
          )}
        </div>
      )}
      <div className="flex-1 min-h-[250px] w-full">
        <div style={{ height, width: '100%', position: 'relative' }}>
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default SalesChart;
