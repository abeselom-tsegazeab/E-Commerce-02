import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { FiUser, FiSun, FiMoon, FiLogOut, FiSettings, FiHelpCircle, FiChevronDown } from 'react-icons/fi';
import { useState, useEffect } from 'react';

const SidebarFooter = ({ isOpen, theme, onThemeToggle, onLogout }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const controls = useAnimation();
  const themeControls = useAnimation();

  const userMenuItems = [
    { 
      icon: <FiUser className="w-5 h-5" />, 
      label: 'Profile', 
      onClick: () => {},
      color: 'text-blue-500'
    },
    { 
      icon: <FiSettings className="w-5 h-5" />, 
      label: 'Settings', 
      onClick: () => {},
      color: 'text-purple-500'
    },
    { 
      icon: <FiHelpCircle className="w-5 h-5" />, 
      label: 'Help Center', 
      onClick: () => {},
      color: 'text-amber-500'
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: 'auto',
      transition: {
        staggerChildren: 0.08,
        when: 'beforeChildren',
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        when: 'afterChildren',
        staggerChildren: 0.05,
        staggerDirection: -1,
        duration: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      x: -20,
      transition: { 
        duration: 0.2,
        ease: 'easeInOut'
      } 
    },
    show: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: 'spring', 
        stiffness: 500, 
        damping: 30,
        mass: 0.5
      } 
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.15,
        ease: 'easeIn'
      }
    }
  };

  // Handle theme toggle animation
  useEffect(() => {
    if (theme === 'dark') {
      themeControls.start({ rotate: 360 });
    } else {
      themeControls.start({ rotate: 0 });
    }
  }, [theme, themeControls]);

  // Handle menu open/close animation
  useEffect(() => {
    if (isOpen) {
      controls.start('show');
    } else {
      controls.start('hidden');
      setIsExpanded(false);
    }
  }, [isOpen, controls]);

  return (
    <motion.div 
      className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg backdrop-saturate-150"
      initial={false}
      animate={controls}
      variants={{
        hidden: { 
          paddingTop: '0.5rem',
          paddingBottom: '0.5rem',
          transition: { duration: 0.3 }
        },
        show: { 
          paddingTop: '1rem',
          paddingBottom: '1rem',
          transition: { 
            duration: 0.4,
            ease: 'easeInOut'
          }
        }
      }}
    >
      <div className="px-2">
        {/* Collapsed State - Only show theme toggle */}
        {!isOpen ? (
          <div className="flex justify-center py-2">
            <motion.button
              onClick={onThemeToggle}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-300 transition-all duration-300"
              whileHover={{ 
                scale: 1.1,
                rotate: theme === 'dark' ? 15 : -15,
                backgroundColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(30, 64, 175, 0.1)'
              }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <motion.div
                animate={themeControls}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                {theme === 'dark' ? (
                  <FiSun className="w-5 h-5 text-amber-300" />
                ) : (
                  <FiMoon className="w-5 h-5 text-blue-600" />
                )}
              </motion.div>
            </motion.button>
          </div>
        ) : (
          /* Expanded State - Show full user profile */
          <>
            <motion.div 
              className="flex items-center justify-between mb-4 cursor-pointer group"
              onClick={() => setIsExpanded(!isExpanded)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center">
                <motion.div 
                  className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"
                  whileHover={{ 
                    rotate: [0, -5, 5, 0],
                    transition: { duration: 0.5 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiUser className="w-5 h-5" />
                  <motion.div 
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"
                    animate={{ 
                      boxShadow: [
                        '0 0 0 0 rgba(74, 222, 128, 0.7)',
                        '0 0 0 10px rgba(74, 222, 128, 0)'
                      ]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      repeatType: 'loop'
                    }}
                  />
                </motion.div>
                
                <motion.div 
                  className="ml-3 overflow-hidden"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { 
                      delay: 0.15,
                      duration: 0.3,
                      ease: 'easeOut'
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    x: -10,
                    transition: { 
                      duration: 0.2,
                      ease: 'easeIn'
                    }
                  }}
                >
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Admin User</p>
                  <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">Administrator</p>
                </motion.div>
              </div>
              
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onThemeToggle();
                  }}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-300 transition-all duration-300"
                  whileHover={{ 
                    scale: 1.1,
                    rotate: theme === 'dark' ? 15 : -15,
                    backgroundColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(30, 64, 175, 0.1)'
                  }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  <motion.div
                    animate={themeControls}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    {theme === 'dark' ? (
                      <FiSun className="w-5 h-5 text-amber-300" />
                    ) : (
                      <FiMoon className="w-5 h-5 text-blue-600" />
                    )}
                  </motion.div>
                </motion.button>
                
                <motion.span
                  className="text-gray-400"
                  animate={{
                    rotate: isExpanded ? 180 : 0,
                    opacity: 1,
                    transition: { 
                      rotate: { type: 'spring', stiffness: 500, damping: 30 },
                      opacity: { duration: 0.2 }
                    }
                  }}
                >
                  <FiChevronDown className="w-5 h-5" />
                </motion.span>
              </div>
            </motion.div>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  className="overflow-hidden"
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  variants={containerVariants}
                >
                  <motion.div className="space-y-1.5 mt-2">
                    {userMenuItems.map((item, index) => (
                      <motion.button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          item.onClick();
                        }}
                        className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300
                          hover:bg-gray-100/70 dark:hover:bg-gray-700/50
                          hover:shadow-sm hover:translate-x-1
                          group`}
                        variants={itemVariants}
                        whileHover={{
                          x: 5,
                          backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                          transition: { 
                            type: 'spring', 
                            stiffness: 500, 
                            damping: 25 
                          }
                        }}
                        whileTap={{ 
                          scale: 0.98,
                          backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <span className={`${item.color} mr-3 group-hover:scale-110 transition-transform duration-300`}>
                          {item.icon}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                          {item.label}
                        </span>
                      </motion.button>
                    ))}
                    
                    <motion.div variants={itemVariants} className="pt-1">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLogout();
                        }}
                        className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl 
                          bg-gradient-to-r from-red-50 to-red-50/70 dark:from-red-900/20 dark:to-red-900/10
                          text-red-500 dark:text-red-400
                          hover:from-red-100 hover:to-red-100/70 dark:hover:from-red-900/30 dark:hover:to-red-900/20
                          hover:shadow-sm hover:shadow-red-100 dark:hover:shadow-red-900/20
                          transition-all duration-300`}
                        whileHover={{
                          x: 5,
                          scale: 1.01,
                          transition: { 
                            type: 'spring', 
                            stiffness: 500, 
                            damping: 25 
                          }
                        }}
                        whileTap={{ 
                          scale: 0.98,
                          backgroundColor: 'rgba(239, 68, 68, 0.1)'
                        }}
                      >
                        <FiLogOut className="w-5 h-5 mr-3" />
                        <span>Logout</span>
                      </motion.button>
                    </motion.div>
                  </motion.div>
                  
                  {/* Version Info */}
                  <motion.div 
                    className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 text-center"
                    variants={itemVariants}
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      v1.0.0 • {new Date().getFullYear()}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SidebarFooter;
