import { useState, useEffect, memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  FiHome, 
  FiShoppingBag, 
  FiUsers, 
  FiDollarSign, 
  FiSettings, 
  FiChevronLeft,
  FiChevronRight,
  FiMoon,
  FiSun,
  FiLogOut,
  FiUser,
  FiPieChart,
  FiTag,
  FiBell
} from 'react-icons/fi';

// Sidebar navigation items
const navItems = [
  { 
    icon: <FiHome className="w-5 h-5" />, 
    text: 'Dashboard', 
    path: '/admin/dashboard',
    badge: null
  },
  { 
    icon: <FiShoppingBag className="w-5 h-5" />, 
    text: 'Products', 
    path: '/admin/products',
    badge: '12'
  },
  { 
    icon: <FiTag className="w-5 h-5" />, 
    text: 'Categories', 
    path: '/admin/categories',
    badge: '5'
  },
  { 
    icon: <FiDollarSign className="w-5 h-5" />, 
    text: 'Orders', 
    path: '/admin/orders',
    badge: '24'
  },
  { 
    icon: <FiUsers className="w-5 h-5" />, 
    text: 'Customers', 
    path: '/admin/customers',
    badge: '1.2k'
  },
  { 
    icon: <FiPieChart className="w-5 h-5" />, 
    text: 'Analytics', 
    path: '/admin/analytics',
    badge: null
  },
  { 
    icon: <FiSettings className="w-5 h-5" />, 
    text: 'Settings', 
    path: '/admin/settings',
    badge: null
  }
];

// Animation variants
const containerVariants = {
  open: { 
    width: '280px',
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 30 
    } 
  },
  closed: { 
    width: '80px',
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 30,
      delay: 0.1
    } 
  }
};

const itemVariants = {
  open: {
    opacity: 1,
    x: 0,
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 25 
    }
  },
  closed: { 
    opacity: 0, 
    x: -20,
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 25 
    }
  }
};

// Badge component for notifications
const Badge = ({ count, isActive }) => (
  <motion.span 
    className={`flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-semibold rounded-full ${
      isActive 
        ? 'bg-white text-emerald-600 dark:bg-emerald-500/90 dark:text-white' 
        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
    }`}
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 500,
        damping: 15
      }
    }}
    whileHover={{ 
      scale: 1.1,
      transition: { 
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    }}
  >
    {count}
  </motion.span>
);

// NavItem component
const NavItem = memo(({ 
  icon, 
  text, 
  path, 
  badge,
  isOpen,
  isActive,
  onClick 
}) => {
  const controls = useAnimation();
  
  // Handle active state animation
  useEffect(() => {
    if (isActive) {
      controls.start({
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        borderLeftColor: 'rgba(5, 150, 105, 1)',
        transition: { 
          backgroundColor: { duration: 0.3 },
          borderLeftColor: { duration: 0.4 }
        }
      });
    } else {
      controls.start({
        backgroundColor: 'transparent',
        borderLeftColor: 'transparent',
        transition: { duration: 0.2 }
      });
    }
  }, [isActive, controls]);

  return (
    <motion.li 
      className={`relative mb-1.5 ${!isOpen ? 'flex justify-center' : ''}`}
      variants={itemVariants}
      whileHover={!isActive ? { 
        x: 4,
        transition: { 
          type: 'spring',
          stiffness: 400,
          damping: 15
        }
      } : {}}
      whileTap={{ scale: 0.98 }}
    >
      <NavLink
        to={path}
        onClick={onClick}
        className={`group flex items-center px-4 py-2.5 rounded-r-lg transition-all duration-300 border-l-4 ${
          isActive 
            ? 'text-emerald-600 dark:text-emerald-300 font-semibold bg-emerald-50/80 dark:bg-emerald-900/20 shadow-sm' 
            : 'text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
        }`}
        style={{
          borderLeftWidth: '4px',
          borderLeftStyle: 'solid',
          borderLeftColor: isActive ? 'rgba(5, 150, 105, 1)' : 'transparent',
        }}
      >
        <motion.div 
          className="flex items-center w-full py-1.5 relative"
          animate={controls}
        >
          <motion.span 
            className={`relative flex items-center justify-center w-8 h-8 rounded-lg ${
              isActive 
                ? 'text-emerald-600 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-900/30' 
                : 'text-gray-500 group-hover:text-emerald-600 dark:text-gray-400 dark:group-hover:text-emerald-300 group-hover:bg-emerald-50/50 dark:group-hover:bg-emerald-900/20'
            }`}
            whileHover={{
              scale: 1.1,
              transition: { type: 'spring', stiffness: 400, damping: 10 }
            }}
            whileTap={{ scale: 0.95 }}
          >
            {icon}
            {!isActive && (
              <motion.span 
                className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"
                initial={{ opacity: 0, scale: 0.5 }}
                whileHover={{ 
                  opacity: 0.3,
                  scale: 1.5,
                  transition: { duration: 0.4 }
                }}
              />
            )}
          </motion.span>
          
          <AnimatePresence>
            {isOpen && (
              <motion.span 
                className="ml-3.5 whitespace-nowrap overflow-hidden text-sm font-medium"
                initial={{ opacity: 0, x: -5 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { 
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                    delay: 0.1
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  x: -5,
                  transition: { duration: 0.1 }
                }}
              >
                {text}
              </motion.span>
            )}
          </AnimatePresence>
          
          {badge && isOpen && (
            <div className="ml-auto">
              <Badge count={badge} isActive={isActive} />
            </div>
          )}
        </motion.div>
        
        {isActive && (
          <motion.div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 dark:bg-emerald-400 rounded-l-full"
            layoutId="activeNavItem"
            initial={false}
            animate={{
              opacity: [0.9, 1, 0.9],
              transition: {
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
              }
            }}
          />
        )}
      </NavLink>
    </motion.li>
  );
});

// Main Sidebar component
const Sidebar = ({ isOpen, onToggle, theme, onThemeToggle }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      if (isMobileView && isOpen) {
        onToggle(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onToggle]);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleClickOutside = (e) => {
      const sidebar = document.querySelector('.sidebar-container');
      if (sidebar && !sidebar.contains(e.target)) {
        onToggle(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, onToggle]);

  return (
    <motion.aside
      className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg z-50 overflow-hidden flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      variants={containerVariants}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {isOpen ? (
          <motion.h1 
            className="text-xl font-bold text-gray-800 dark:text-white"
            initial={{ opacity: 0, x: -10 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              transition: { delay: 0.1 }
            }}
          >
            Admin Panel
          </motion.h1>
        ) : (
          <motion.div
            className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { delay: 0.1 }
            }}
          >
            <span className="text-white font-bold">AP</span>
          </motion.div>
        )}
        
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? (
            <FiChevronLeft className="w-5 h-5" />
          ) : (
            <FiChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              text={item.text}
              path={item.path}
              badge={item.badge}
              isOpen={isOpen}
              isActive={location.pathname === item.path}
              onClick={() => isMobile && onToggle(false)}
            />
          ))}
        </ul>
      </nav>
      
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
            onClick={() => {
              // Handle logout
              console.log('Logout clicked');
            }}
            className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
          >
            <FiLogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        )}
      </div>
    </motion.aside>
  );
};

export default memo(Sidebar);