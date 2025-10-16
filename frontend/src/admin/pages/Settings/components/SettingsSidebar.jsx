import { FiUser, FiLock, FiBell, FiCreditCard, FiGlobe, FiMoon, FiSun } from 'react-icons/fi';

const SettingsSidebar = ({ activeTab, setActiveTab, darkMode, setDarkMode }) => {
  const tabs = [
    { id: 'profile', icon: <FiUser className="mr-2" />, label: 'Profile' },
    { id: 'security', icon: <FiLock className="mr-2" />, label: 'Security' },
    { id: 'notifications', icon: <FiBell className="mr-2" />, label: 'Notifications' },
    { id: 'billing', icon: <FiCreditCard className="mr-2" />, label: 'Billing' },
    { id: 'preferences', icon: <FiGlobe className="mr-2" />, label: 'Preferences' },
  ];

  return (
    <div className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <nav className="space-y-1 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  darkMode ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span className="sr-only">Toggle dark mode</span>
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                >
                  {darkMode ? (
                    <FiMoon className="h-3 w-3 m-1 text-indigo-600" />
                  ) : (
                    <FiSun className="h-3 w-3 m-1 text-yellow-500" />
                  )}
                </span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default SettingsSidebar;
