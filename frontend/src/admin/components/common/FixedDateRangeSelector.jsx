import { useState, useEffect, useRef, useMemo } from 'react';
import { FiCalendar, FiChevronDown, FiX, FiCheck, FiChevronRight } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import { createPortal } from 'react-dom';
import 'react-datepicker/dist/react-datepicker.css';
import './DateRangeSelector.css';

const dateRanges = [
  'Today',
  'Yesterday',
  'Last 7 days',
  'Last 30 days',
  'This month',
  'Last month',
  'Custom range'
];

const CustomHeader = ({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <div className="text-base font-medium text-gray-700">
      {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)}
    </div>
    <div className="flex space-x-2">
      <button
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        type="button"
        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:opacity-30"
        aria-label="Previous month"
      >
        <FiChevronRight className="w-4 h-4 transform rotate-180" />
      </button>
      <button
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        type="button"
        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:opacity-30"
        aria-label="Next month"
      >
        <FiChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const FixedDateRangeSelector = ({ onDateRangeChange, defaultRange = 'Last 30 days' }) => {
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(defaultRange);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [daysCount, setDaysCount] = useState(0);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  // Calculate days between two dates
  const calculateDaysBetween = (start, end) => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  };

  // Update days count when dates change
  useEffect(() => {
    if (startDate && endDate) {
      setDaysCount(calculateDaysBetween(startDate, endDate));
    } else {
      setDaysCount(0);
    }
  }, [startDate, endDate]);
  
  // Create portal container for the date picker
  const portalContainer = useMemo(() => {
    if (typeof document !== 'undefined') {
      const el = document.createElement('div');
      el.className = 'datepicker-portal';
      return el;
    }
    return null;
  }, []);
  
  // Add portal container to body on mount
  useEffect(() => {
    if (portalContainer) {
      document.body.appendChild(portalContainer);
      setMounted(true);
      return () => {
        if (document.body.contains(portalContainer)) {
          document.body.removeChild(portalContainer);
        }
      };
    }
  }, [portalContainer]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDateMenuOpen(false);
        setError('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Calculate date range based on selection
  const calculateDateRange = (range) => {
    const today = new Date();
    const start = new Date();
    let end = new Date();
    
    switch (range) {
      case 'Today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'Yesterday':
        start.setDate(today.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(today);
        end.setDate(today.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'Last 7 days':
        start.setDate(today.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'Last 30 days':
        start.setDate(today.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'This month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'Last month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        // For custom range, use the selected dates
        return { start: startDate, end: endDate };
    }
    
    return { start, end };
  };
  
  // Handle date range selection
  const handleRangeSelect = (range) => {
    if (range === 'Custom range') {
      setShowCustomRange(true);
      setIsDateMenuOpen(false);
      return;
    }
    
    const { start, end } = calculateDateRange(range);
    setStartDate(start);
    setEndDate(end);
    setSelectedRange(range);
    setIsDateMenuOpen(false);
    onDateRangeChange({ range, start, end });
  };
  
  // Handle custom date range apply
  const handleApplyCustomRange = () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    if (startDate > endDate) {
      setError('Start date cannot be after end date');
      return;
    }
    
    setSelectedRange('Custom range');
    setShowCustomRange(false);
    onDateRangeChange({ 
      range: 'Custom range', 
      start: startDate, 
      end: endDate 
    });
  };
  
  // Use a portal for the date picker to prevent clipping
  const [portalElement, setPortalElement] = useState(null);

  useEffect(() => {
    // Create a portal container for the date picker
    const portal = document.createElement('div');
    portal.id = 'datepicker-root';
    portal.style.position = 'fixed';
    portal.style.top = '0';
    portal.style.left = '0';
    portal.style.width = '100%';
    portal.style.height = '0';
    portal.style.zIndex = '9999';
    document.body.appendChild(portal);
    setPortalElement(portal);

    // Add global styles for the date picker
    const style = document.createElement('style');
    style.textContent = `
      .react-datepicker {
        font-family: inherit;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        z-index: 10000 !important;
      }
      .react-datepicker-popper {
        z-index: 10000 !important;
      }
      .react-datepicker-popper[data-placement^=bottom] {
        padding-top: 8px;
      }
      .react-datepicker__header {
        background-color: white;
        border-bottom: 1px solid #e2e8f0;
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
      }
      .react-datepicker-popper {
        z-index: 10000 !important;
      }
      #datepicker-root {
        z-index: 9999;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.removeChild(portal);
      document.head.removeChild(style);
    };
  }, []);

  // Popper config for fixed positioning below inputs
  const popperModifiers = [
    {
      name: 'offset',
      options: {
        offset: [0, 8],
      },
    },
    {
      name: 'preventOverflow',
      enabled: true,
      options: {
        altAxis: true,
        boundary: 'viewport',
        padding: 8,
      },
    },
  ];

  // Get the input ref for positioning
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const [activeInput, setActiveInput] = useState(null);
  const [inputRect, setInputRect] = useState(null);

  const updateInputRect = (ref) => {
    if (ref?.current) {
      const rect = ref.current.getBoundingClientRect();
      setInputRect({
        left: rect.left,
        top: rect.top + rect.height + window.scrollY + 4,
        width: rect.width,
      });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {portalElement && createPortal(
        <div 
          id="datepicker-portal" 
          style={inputRect ? {
            position: 'absolute',
            left: `${inputRect.left}px`,
            top: `${inputRect.top}px`,
            width: `${inputRect.width}px`,
            zIndex: 9999,
          } : { display: 'none' }}
        />,
        document.body
      )}
      <button
        type="button"
        onClick={() => {
          setIsDateMenuOpen(!isDateMenuOpen);
          if (!isDateMenuOpen) {
            setShowCustomRange(false);
            setError('');
          }
        }}
        className="inline-flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-200 hover:border-emerald-400 dark:hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
      >
        <span className="flex items-center">
          <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
          {selectedRange}
        </span>
        <FiChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform duration-200 ${isDateMenuOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isDateMenuOpen && (
        <div className="absolute right-0 z-[100] w-56 mt-2 origin-top-right bg-white rounded-xl shadow-lg dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {dateRanges.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => handleRangeSelect(range)}
                className={`block w-full px-4 py-2 text-sm text-left ${
                  selectedRange === range
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      )}

      {mounted && showCustomRange && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Select Date Range</h3>
                <button
                  onClick={() => setShowCustomRange(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                  aria-label="Close"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Start Date
                    </label>
                    <div className="relative">
                      <div ref={startDateRef}>
                        <DatePicker
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                          onFocus={() => {
                            setActiveInput('start');
                            updateInputRect(startDateRef);
                          }}
                          selectsStart
                          startDate={startDate}
                          endDate={endDate}
                          maxDate={endDate || new Date()}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholderText="Select start date"
                          dateFormat="MMM d, yyyy"
                          isClearable
                          clearButtonClassName="absolute right-8 text-gray-400 hover:text-gray-600"
                          popperContainer={({ children }) => 
                            portalElement && activeInput === 'start' ? 
                              createPortal(children, document.getElementById('datepicker-portal') || portalElement) : 
                              null
                          }
                          popperClassName="react-datepicker-popper"
                          popperPlacement="bottom"
                          popperModifiers={popperModifiers}
                          showPopperArrow={false}
                          withPortal={false}
                          renderCustomHeader={CustomHeader}
                        />
                        <FiCalendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                      <FiCalendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      End Date
                    </label>
                    <div className="relative">
                      <div ref={endDateRef}>
                        <DatePicker
                          selected={endDate}
                          onChange={(date) => setEndDate(date)}
                          onFocus={() => {
                            setActiveInput('end');
                            updateInputRect(endDateRef);
                          }}
                          selectsEnd
                          startDate={startDate}
                          endDate={endDate}
                          minDate={startDate}
                          maxDate={new Date()}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholderText="Select end date"
                          dateFormat="MMM d, yyyy"
                          isClearable
                          clearButtonClassName="absolute right-8 text-gray-400 hover:text-gray-600"
                          popperContainer={({ children }) => 
                            portalElement && activeInput === 'end' ? 
                              createPortal(children, document.getElementById('datepicker-portal') || portalElement) : 
                              null
                          }
                          popperClassName="react-datepicker-popper"
                          popperPlacement="bottom"
                          popperModifiers={popperModifiers}
                          showPopperArrow={false}
                          withPortal={false}
                          renderCustomHeader={CustomHeader}
                        />
                        <FiCalendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                      <FiCalendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                
                {startDate && endDate && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 text-center">
                    {daysCount} {daysCount === 1 ? 'day' : 'days'} selected
                  </div>
                )}
                
                {error && (
                  <div className="text-sm text-red-600 mt-1">
                    {error}
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCustomRange(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCustomRange}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>,
        portalContainer
      )}
    </div>
  );
};

export default FixedDateRangeSelector;
