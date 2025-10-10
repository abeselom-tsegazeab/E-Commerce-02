import PropTypes from 'prop-types';

const LoadingSpinner = ({ size = 'md', fullScreen = false, className = '' }) => {
  // Define size variants
  const sizeVariants = {
    xs: 'w-5 h-5 border-2',
    sm: 'w-10 h-10 border-2',
    md: 'w-16 h-16 border-2',
    lg: 'w-20 h-20 border-2',
    xl: 'w-24 h-24 border-[3px]',
  };

  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen bg-gray-900' : ''} ${className}`}>
      <div className='relative'>
        {/* Background circle */}
        <div className={`${sizeVariants[size]} border-emerald-200 rounded-full`} />
        
        {/* Spinning border */}
        <div 
          className={`${sizeVariants[size]} border-emerald-500 border-t-2 animate-spin rounded-full absolute left-0 top-0`}
          style={{
            animation: 'spin 1s linear infinite',
          }}
        />
        
        {/* Screen reader only text */}
        <div className='sr-only'>Loading</div>
      </div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  fullScreen: PropTypes.bool,
  className: PropTypes.string,
};

export default LoadingSpinner;
