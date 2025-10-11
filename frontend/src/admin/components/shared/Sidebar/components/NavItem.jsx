import { memo, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from './Badge';
import { useAnimation } from 'framer-motion';

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

export default NavItem;
