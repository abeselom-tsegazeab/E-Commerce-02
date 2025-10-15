import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const DateRangePicker = ({ dateRange, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  // Close the date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  const handleApply = () => {
    setIsOpen(false);
    // The parent component's onChange will be called with the updated date range
  };

  const quickSelections = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'This month', days: 'month' },
    { label: 'Last month', days: 'lastMonth' },
  ];

  const applyQuickSelection = (days) => {
    const end = new Date();
    let start = new Date();

    if (days === 'month') {
      start = new Date(start.getFullYear(), start.getMonth(), 1);
    } else if (days === 'lastMonth') {
      start = new Date(start.getFullYear(), start.getMonth() - 1, 1);
      end.setDate(0); // Last day of previous month
    } else {
      start.setDate(start.getDate() - days);
    }

    onChange({
      selection: {
        startDate: start,
        endDate: end,
        key: 'selection',
      },
    });
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
        {`${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Quick Select</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickSelections.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => applyQuickSelection(item.days)}
                    className="text-left p-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => {
                  const start = new Date(dateRange.startDate);
                  start.setMonth(start.getMonth() - 1);
                  const end = new Date(dateRange.endDate);
                  end.setMonth(end.getMonth() - 1);
                  onChange({
                    selection: {
                      startDate: start,
                      endDate: end,
                      key: 'selection',
                    },
                  });
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {format(dateRange.startDate, 'MMM yyyy')} - {format(dateRange.endDate, 'MMM yyyy')}
              </div>
              <button
                onClick={() => {
                  const start = new Date(dateRange.startDate);
                  start.setMonth(start.getMonth() + 1);
                  const end = new Date(dateRange.endDate);
                  end.setMonth(end.getMonth() + 1);
                  // Don't allow selecting future dates
                  if (end <= new Date()) {
                    onChange({
                      selection: {
                        startDate: start,
                        endDate: end,
                        key: 'selection',
                      },
                    });
                  }
                }}
                className={`p-1 rounded-full ${
                  new Date(dateRange.endDate) >= new Date()
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
                disabled={new Date(dateRange.endDate) >= new Date()}
              >
                <FiChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
