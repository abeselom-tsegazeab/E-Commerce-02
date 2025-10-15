import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationItem = ({ notification }) => {
  const { markAsRead } = useNotifications();
  const { id, title, message, type, read, createdAt, link, priority = 'medium' } = notification;

  const getTypeStyles = () => {
    switch (type) {
      case 'order':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'user':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'inventory':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'review':
        return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'alert':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'success':
        return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityBadge = () => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    markAsRead(id);
    if (link) {
      window.location.href = link;
    }
  };

  const content = (
    <div 
      className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
        !read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <div className={`h-2 w-2 rounded-full ${!read ? 'bg-indigo-500' : 'bg-transparent'}`} />
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{message}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeStyles()}`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge()}`}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block hover:no-underline">
        {content}
      </Link>
    );
  }

  return content;
};

export default NotificationItem;
