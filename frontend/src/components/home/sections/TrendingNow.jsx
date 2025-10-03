import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Zap } from 'lucide-react';
import ProductCard from '../../ProductCard';

const TrendingNow = ({ products = [] }) => {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4 sm:mb-0">
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-pink-600 bg-pink-50 rounded-full mb-3">
              <Zap className="w-3.5 h-3.5 mr-1.5 fill-current" />
              TRENDING NOW
            </span>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Hot Picks of the Week
            </h2>
            <p className="mt-2 text-gray-500">Discover what everyone is loving right now</p>
          </div>
          
          <motion.button 
            className="group relative inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-full overflow-hidden mt-4 sm:mt-0"
            whileHover={{
              scale: 1.05,
              boxShadow: '0 10px 15px -3px rgba(236, 72, 153, 0.3), 0 4px 6px -2px rgba(236, 72, 153, 0.2)'
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <span className="relative z-10 flex items-center">
              <motion.span 
                initial={{ x: 0 }}
                animate={{ x: [0, 4, 0] }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: 'reverse',
                  duration: 2,
                  ease: 'easeInOut'
                }}
                className="inline-block"
              >
                🔥
              </motion.span>
              <span className="ml-2">View All</span>
            </span>
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-600 opacity-0 group-hover:opacity-100"
              initial={{ opacity: 0 }}
              whileHover={{ 
                opacity: 1,
                transition: { duration: 0.3 }
              }}
            />
            <motion.div 
              className="absolute -left-full top-0 w-1/2 h-full bg-white/20 -skew-x-12"
              initial={{ x: '-100%' }}
              whileHover={{ 
                x: '300%',
                transition: { duration: 0.8, ease: 'easeInOut' }
              }}
            />
            <ArrowRight className="w-4 h-4 ml-2 relative z-10 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110" />
          </motion.button>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product, index) => (
            <motion.div
              key={product.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ 
                opacity: 1, 
                y: 0,
                transition: { 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1]
                }
              }}
              whileHover={{ 
                y: -8,
                transition: { 
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1]
                }
              }}
              viewport={{ once: true, margin: "-50px" }}
              className="group"
            >
              <div className="h-full">
                <ProductCard product={product} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingNow;
