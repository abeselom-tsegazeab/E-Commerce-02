import { FiMapPin } from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';
import { useTheme } from "../../../contexts/ThemeContext";
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

const GeographicData = () => {
  const { isDarkMode } = useTheme();

  // Colors that work well in both light and dark modes
  const chartColors = {
    light: {
      background: [
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
      ],
      border: [
        'rgba(54, 162, 235, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
      ],
      text: '#1f2937', // gray-800
      grid: 'rgba(0, 0, 0, 0.1)',
      tick: '#6b7280', // gray-500
    },
    dark: {
      background: [
        'rgba(96, 165, 250, 0.7)', // blue-400
        'rgba(248, 113, 113, 0.7)', // red-400
        'rgba(251, 191, 36, 0.7)', // amber-400
        'rgba(52, 211, 153, 0.7)', // emerald-400
        'rgba(167, 139, 250, 0.7)', // violet-400
        'rgba(251, 146, 60, 0.7)', // orange-400
      ],
      border: [
        'rgba(96, 165, 250, 1)',
        'rgba(248, 113, 113, 1)',
        'rgba(251, 191, 36, 1)',
        'rgba(52, 211, 153, 1)',
        'rgba(167, 139, 250, 1)',
        'rgba(251, 146, 60, 1)',
      ],
      text: '#f3f4f6', // gray-100
      grid: 'rgba(255, 255, 255, 0.1)',
      tick: '#9ca3af', // gray-400
    },
  };

  const colors = isDarkMode ? chartColors.dark : chartColors.light;

  // Mock data for geographic distribution
  const geoData = {
    labels: ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'],
    datasets: [
      {
        label: 'Orders by Region',
        data: [1200, 900, 1500, 700, 400, 300],
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: colors.text,
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'Orders by Geographic Region',
        color: colors.text,
        font: {
          size: 14,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        titleColor: isDarkMode ? '#f3f4f6' : '#111827',
        bodyColor: isDarkMode ? '#e5e7eb' : '#4b5563',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        ticks: {
          color: colors.tick,
        },
        grid: {
          color: colors.grid,
          drawBorder: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: colors.tick,
          callback: function(value) {
            return value.toLocaleString();
          }
        },
        grid: {
          color: colors.grid,
          drawBorder: false,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Geographic Distribution</h3>
        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
          <FiMapPin className="h-5 w-5" />
        </div>
      </div>
      <div className="h-80">
        <Bar data={geoData} options={options} />
      </div>
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>Top performing regions based on order volume.</p>
      </div>
    </div>
  );
};

export default GeographicData;