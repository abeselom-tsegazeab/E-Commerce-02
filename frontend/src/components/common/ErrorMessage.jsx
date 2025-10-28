import PropTypes from 'prop-types';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';

const ErrorMessage = ({ 
  message = 'An error occurred', 
  className = '',
  onRetry,
  retryText = 'Try Again'
}) => {
  return (
    <div 
      className={`bg-red-50 border-l-4 border-red-400 p-4 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">
            {message}
          </p>
          {onRetry && (
            <div className="mt-2">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {retryText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  className: PropTypes.string,
  onRetry: PropTypes.func,
  retryText: PropTypes.string
};

export default ErrorMessage;
