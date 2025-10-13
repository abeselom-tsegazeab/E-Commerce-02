import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NavItem = memo(({ 
  icon, 
  text, 
  path, 
  isOpen,
  isActive,
  onClick 
}) => {

  return (
    <motion.li
      className="relative my-1"
      whileHover={{ 
        transform: 'translateX(4px)',
        transition: { type: 'spring', stiffness: 400, damping: 15 }
      }}
    >
      <NavLink
        to={path}
        className={({ isActive: isNavActive }) =>
          `group flex items-center px-4 py-2.5 text-sm font-medium rounded-r-2xl mx-1 transition-all duration-300
          ${isNavActive 
            ? 'text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20' 
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
          }`
        }
        onClick={onClick}
        title={!isOpen ? text : ''}
      >

        <div className={`flex items-center justify-center ${isOpen ? 'w-8' : 'w-full'}`}>
          <motion.span 
            className="relative"
            whileHover={{ 
              scale: 1.1,
              rotate: [0, -5, 5, -5, 0],
              transition: { duration: 0.5 }
            }}
            whileTap={{ scale: 0.9 }}
          >
            {icon}
          </motion.span>
          
          {/* Hover background effect */}
          <motion.span 
            className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-emerald-500/10 rounded-2xl -z-10"
            initial={{ opacity: 0, width: 0 }}
            whileHover={{ 
              opacity: 1,
              width: '100%',
              transition: { duration: 0.3, ease: 'easeInOut' }
            }}
          />
        </div>
        
        <AnimatePresence>
          {isOpen && (
            <motion.span 
              className="ml-3.5 whitespace-nowrap overflow-hidden"
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                transition: { 
                  delay: 0.1, 
                  duration: 0.25,
                  ease: [0.4, 0, 0.2, 1]
                }
              }}
              exit={{ 
                opacity: 0, 
                x: -15,
                transition: { 
                  duration: 0.15,
                  ease: [0.4, 0, 0.2, 1]
                }
              }}
            >
              {text}
            </motion.span>
          )}
        </AnimatePresence>
      </NavLink>
    </motion.li>
  );
});

export default NavItem;