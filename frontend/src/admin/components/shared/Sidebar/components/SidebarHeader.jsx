import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const SidebarHeader = ({ isOpen, onToggle }) => {
  return (
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
  );
};

export default SidebarHeader;
