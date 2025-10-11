import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import Sidebar from '../shared/Sidebar';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  // Handle mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 ${theme}`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={toggleSidebar} 
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        isSidebarOpen ? 'md:ml-64' : 'md:ml-20'
      }`}>
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm z-10 sticky top-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <button 
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
                aria-label="Toggle sidebar"
              >
                <svg
                  className="w-6 h-6 text-gray-500 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              </button>
              <h2 className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">
                Dashboard
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                aria-label="Notifications"
              >
                <svg
                  className="w-6 h-6 text-gray-500 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
              </button>
              
              <div className="relative group">
                <button 
                  className="flex items-center space-x-2 focus:outline-none"
                  aria-label="User menu"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold">
                    U
                  </div>
                </button>
                
                {/* Dropdown menu - will be implemented later */}
                <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Profile
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Settings
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    Sign out
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
