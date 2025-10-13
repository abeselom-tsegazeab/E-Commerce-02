import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const SidebarHeader = ({ isOpen, onToggle }) => {
  return (
    <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <motion.div 
          className="flex-1 flex items-center justify-between"
          initial={false}
          animate={{
            width: isOpen ? '100%' : 'auto'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.h1 
                key="title"
                className="text-xl font-bold text-white whitespace-nowrap"
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { duration: 0.2 }
                }}
                exit={{ opacity: 0, x: -10 }}
              >
                Admin Panel
              </motion.h1>
            )}
          </AnimatePresence>
          
          <motion.button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors duration-200"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isOpen ? (
              <FiChevronLeft className="w-5 h-5" />
            ) : (
              <FiChevronRight className="w-5 h-5" />
            )}
          </motion.button>
        </motion.div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.p 
            className="mt-1 text-sm font-medium text-white/80"
            initial={{ opacity: 0, y: -5 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: 0.2 }
            }}
            exit={{ opacity: 0, y: -5 }}
          >
            Welcome back, Admin
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SidebarHeader;