import { useState } from 'react';
import { FiTrash2, FiEye, FiEyeOff, FiCopy } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const BulkActions = ({ selectedItems, onBulkAction }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  
  const handleAction = (action) => {
    if (action === 'delete') {
      if (isConfirming) {
        onBulkAction('delete');
        setIsConfirming(false);
      } else {
        setIsConfirming(true);
        // Auto-hide confirmation after 3 seconds
        setTimeout(() => setIsConfirming(false), 3000);
      }
    } else {
      onBulkAction(action);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">
        {selectedItems.length} selected
      </span>
      
      <button
        onClick={() => handleAction('publish')}
        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        aria-label="Publish selected items"
      >
        <FiEye className="mr-1.5 h-4 w-4" />
        Publish
      </button>
      
      <button
        onClick={() => handleAction('unpublish')}
        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        aria-label="Unpublish selected items"
      >
        <FiEyeOff className="mr-1.5 h-4 w-4" />
        Unpublish
      </button>
      
      <button
        onClick={() => handleAction('duplicate')}
        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label="Duplicate selected items"
      >
        <FiCopy className="mr-1.5 h-4 w-4" />
        Duplicate
      </button>
      
      <div className="relative">
        <button
          onClick={() => handleAction('delete')}
          className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isConfirming 
              ? 'bg-red-700 text-white border-red-700 focus:ring-red-500' 
              : 'bg-white text-red-600 border-red-300 hover:bg-red-50 focus:ring-red-500 dark:bg-gray-800 dark:border-gray-600 dark:text-red-400 dark:hover:bg-gray-700'
          }`}
          aria-label={isConfirming ? 'Confirm delete' : 'Delete selected items'}
        >
          <FiTrash2 className="mr-1.5 h-4 w-4" />
          {isConfirming ? 'Confirm Delete' : 'Delete'}
        </button>
      </div>
    </div>
  );
};

export default BulkActions;
