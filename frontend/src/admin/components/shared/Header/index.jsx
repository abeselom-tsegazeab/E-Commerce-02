import { useState, useRef, useEffect } from 'react';
import { FiSearch, FiBell, FiUser, FiSettings, FiLogOut, FiSun, FiMoon, FiMenu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../../contexts/ThemeContext';

const Header = ({ isSidebarOpen, toggleSidebar, onThemeToggle }) => {
  const { theme } = useTheme();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(true);
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mock notifications data
  const notifications = [
    { id: 1, message: 'New order received', time: '5 min ago', read: false },
    { id: 2, message: 'New customer registered', time: '1 hour ago', read: true },
    { id: 3, message: 'Inventory low on product X', time: '3 hours ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm z-10 sticky top-0 border-b border-gray-100 dark:border-gray-700 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
      <div className="flex items-center justify-between p-4">
        {/* Left side - Menu button and search */}
        <div className="flex items-center flex-1">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 mr-2 md:hidden"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>

          <div className={`relative ml-2 md:ml-4 ${isSearchFocused ? 'flex-1 max-w-2xl' : 'w-64'}`}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className={`block w-full pl-10 pr-3 py-2 border border-transparent rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${isSearchFocused ? 'bg-white dark:bg-gray-800 shadow-md' : ''}`}
                placeholder="Search..."
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {isSearchFocused && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 rounded">
                    Esc
                  </kbd>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Icons */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors duration-200"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <FiSun className="h-5 w-5 text-amber-300" />
            ) : (
              <FiMoon className="h-5 w-5 text-blue-600" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setHasNewNotifications(false);
                setIsProfileOpen(false);
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 relative"
              aria-label="Notifications"
            >
              <FiBell className="h-5 w-5" />
              {hasNewNotifications && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800 dark:text-white">Notifications</h3>
                      <button className="text-xs text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400">
                        Mark all as read
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                          <p className="text-sm text-gray-700 dark:text-gray-200">{notification.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No new notifications
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-100 dark:border-gray-700 text-center">
                    <button className="text-sm text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="User menu"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-medium">
                AU
              </div>
              <span className="hidden md:inline-block text-sm font-medium text-gray-700 dark:text-gray-200">
                Admin User
              </span>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-medium">
                        AU
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <a
                      href="#"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FiUser className="mr-3 h-5 w-5 text-gray-400" />
                      Your Profile
                    </a>
                    <a
                      href="#"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FiSettings className="mr-3 h-5 w-5 text-gray-400" />
                      Settings
                    </a>
                  </div>
                  <div className="py-1 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => {}}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FiLogOut className="mr-3 h-5 w-5" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;