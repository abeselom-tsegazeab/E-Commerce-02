import { FiUser, FiSun, FiMoon, FiLogOut } from 'react-icons/fi';

const SidebarFooter = ({ isOpen, theme, onThemeToggle, onLogout }) => {
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-300 font-semibold">
            <FiUser className="w-5 h-5" />
          </div>
          {isOpen && (
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-800 dark:text-white">Admin User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
          )}
        </div>
        
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <FiSun className="w-5 h-5" />
          ) : (
            <FiMoon className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {isOpen && (
        <button
          onClick={onLogout}
          className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
        >
          <FiLogOut className="w-5 h-5 mr-2" />
          Logout
        </button>
      )}
    </div>
  );
};

export default SidebarFooter;
