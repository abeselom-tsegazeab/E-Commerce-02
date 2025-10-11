import { motion } from 'framer-motion';

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

export default Badge;
