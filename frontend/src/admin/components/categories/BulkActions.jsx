import { FiTrash2, FiEye, FiEyeOff, FiX } from 'react-icons/fi';

export const BulkActions = ({
  selectedCount = 0,
  onBulkDelete = () => {},
  onBulkStatusToggle = () => {},
  onClearSelection = () => {},
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 mb-4 border border-indigo-100 dark:border-indigo-900/50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center">
          <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
            {selectedCount} {selectedCount === 1 ? 'category' : 'categories'} selected
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className="ml-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-200 dark:hover:bg-indigo-900/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => onBulkStatusToggle('active')}
          >
            <FiEye className="w-3.5 h-3.5 mr-1.5" />
            Activate
          </button>
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 dark:hover:bg-yellow-900/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            onClick={() => onBulkStatusToggle('inactive')}
          >
            <FiEyeOff className="w-3.5 h-3.5 mr-1.5" />
            Deactivate
          </button>
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={onBulkDelete}
          >
            <FiTrash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;
