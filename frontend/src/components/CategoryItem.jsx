import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CategoryItem = ({ category }) => {
  return (
    <motion.div 
      className='relative overflow-hidden rounded-xl shadow-md group h-64 sm:h-80 lg:h-96 bg-white'
      whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      transition={{ duration: 0.3 }}
    >
      <Link to={category.href} className='block h-full'>
        <div className='relative h-full w-full overflow-hidden rounded-xl'>
          {/* Sale Badge */}
          {category.isSale && (
            <div className='absolute top-4 right-4 z-20'>
              <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white'>
                Sale
              </span>
            </div>
          )}
          
          {/* Image with overlay */}
          <div className='absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
          
          <img
            src={category.imageUrl}
            alt={category.name}
            className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
            loading='lazy'
          />
          
          {/* Content */}
          <div className='absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300'>
            <h3 className='text-2xl font-bold text-white mb-1'>{category.name}</h3>
            <p className='text-gray-200 text-sm'>{category.description}</p>
            
            {/* Hidden button that appears on hover */}
            <div className='mt-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300'>
              <span className='inline-flex items-center text-sm font-medium text-white border-b border-transparent hover:border-white transition-colors'>
                Shop now
                <svg className='ml-1 w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M14 5l7 7m0 0l-7 7m7-7H3' />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CategoryItem;
