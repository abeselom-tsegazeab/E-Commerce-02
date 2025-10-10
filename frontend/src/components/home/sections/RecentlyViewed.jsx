import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowRight, Eye, X } from 'lucide-react';
import ProductCard from '../../ProductCard';
import { useEffect, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

const RecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [viewCounts, setViewCounts] = useState({});
  const [isHovered, setIsHovered] = useState(null);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Track view counts
  const trackView = (productId) => {
    setViewCounts(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  // Remove item from recently viewed
  const removeItem = (id, e) => {
    e.stopPropagation();
    setRecentlyViewed(prev => prev.filter(item => item.id !== id));
  };

  useEffect(() => {
    // Mock data - in a real app, you would get this from local storage or your backend
    const mockData = [
      {
        id: 101,
        name: 'Classic White Shirt',
        price: 49.99,
        image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1025&q=80',
        rating: 4.5,
        category: 'Shirts',
        colors: ['#ffffff', '#f3f4f6', '#e5e7eb']
      },
      {
        id: 102,
        name: 'Slim Fit Jeans',
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1026&q=80',
        rating: 4.2,
        category: 'Pants',
        colors: ['#1f2937', '#111827', '#030712']
      },
      {
        id: 103,
        name: 'Leather Jacket',
        price: 199.99,
        image: 'https://images.unsplash.com/photo-1551028719-00167d1f8bbf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        rating: 4.8,
        category: 'Outerwear',
        colors: ['#1c1917', '#0f172a', '#1e293b']
      },
      {
        id: 104,
        name: 'Running Shoes',
        price: 129.99,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        rating: 4.6,
        category: 'Footwear',
        colors: ['#1e40af', '#1e3a8a', '#1e1b4b']
      }
    ];
    
    setRecentlyViewed(mockData);
    
    // Initialize view counts from localStorage or set to 0
    const initialViewCounts = mockData.reduce((acc, item) => {
      acc[item.id] = 0;
      return acc;
    }, {});
    setViewCounts(initialViewCounts);
  }, []);

  // Track views when component comes into view
  useEffect(() => {
    if (inView) {
      recentlyViewed.forEach(product => trackView(product.id));
    }
  }, [inView]);

  if (recentlyViewed.length === 0) return null;

  // Animation variants for container
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  // Animation variants for cards
  const item = {
    hidden: { y: 20, opacity: 0, scale: 0.98 },
    show: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        duration: 0.5
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.3 }
    },
    hover: {
      y: -5,
      scale: 1.02,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15
      }
    }
  };

  // Animation variants for image
  const imageHover = {
    scale: 1.1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  };

  return (
    <section ref={ref} className="py-16 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { 
              type: 'spring',
              stiffness: 100,
              damping: 20
            } 
          }}
          className="flex flex-col items-center text-center mb-12"
        >
          <motion.div 
            className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 mb-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              transition: { 
                delay: 0.2,
                type: 'spring',
                stiffness: 200
              } 
            }}
          >
            <Clock className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-indigo-700">Recently Viewed</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Your Browsing History</h2>
          <motion.p 
            className="text-gray-500 max-w-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: 0.3 }
            }}
          >
            Items you've viewed recently will appear here for easy access
          </motion.p>
        </motion.div>

        <AnimatePresence>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {recentlyViewed.map((product, index) => (
              <motion.div
                key={product.id}
                variants={item}
                className="relative group"
                onMouseEnter={() => setIsHovered(product.id)}
                onMouseLeave={() => setIsHovered(null)}
                whileHover="hover"
                layout
              >
                <motion.div 
                  className="absolute -inset-1 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-500 -z-10"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: isHovered === product.id ? 1 : 0,
                    transition: { duration: 0.4 }
                  }}
                />
                
                <motion.div 
                  className="relative bg-white rounded-xl overflow-hidden shadow-sm h-full flex flex-col border border-gray-100"
                  whileHover={{ 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                    transition: { duration: 0.3 }
                  }}
                >
                  <div className="relative overflow-hidden aspect-square">
                    <motion.div 
                      className="w-full h-full"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.img 
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        variants={{
                          hover: imageHover
                        }}
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center backdrop-blur-sm"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { delay: 0.4 + (index * 0.05) }
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      <span>{viewCounts[product.id] || 0}</span>
                    </motion.div>
                    
                    <motion.button
                      onClick={(e) => removeItem(product.id, e)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-md hover:bg-red-50 transition-colors"
                      whileHover={{ 
                        scale: 1.1,
                        rotate: 90,
                        transition: { type: 'spring', stiffness: 500 }
                      }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </motion.button>
                    
                    <motion.div 
                      className="absolute bottom-2 left-2 flex space-x-1"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ 
                        opacity: 1, 
                        x: 0,
                        transition: { 
                          delay: 0.5 + (index * 0.05),
                          type: 'spring',
                          stiffness: 300
                        }
                      }}
                    >
                      {product.colors?.map((color, i) => (
                        <motion.div 
                          key={i}
                          className="w-4 h-4 rounded-full border-2 border-white/30 shadow-sm"
                          style={{ backgroundColor: color }}
                          whileHover={{ 
                            scale: 1.2,
                            y: -2,
                            transition: { type: 'spring', stiffness: 400 }
                          }}
                        />
                      ))}
                    </motion.div>
                  </div>
                  
                  <motion.div 
                    className="p-4 flex-1 flex flex-col"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { 
                        delay: 0.3 + (index * 0.03),
                        duration: 0.4
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                      <motion.span 
                        className="font-bold text-gray-900"
                        whileHover={{ scale: 1.05 }}
                      >
                        ${product.price.toFixed(2)}
                      </motion.span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <motion.svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            whileHover={{ 
                              scale: 1.2,
                              transition: { type: 'spring', stiffness: 500 }
                            }}
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </motion.svg>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
                      </div>
                      
                      <motion.button 
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                        whileHover={{ 
                          x: 3,
                          color: '#4f46e5',
                          transition: { type: 'spring', stiffness: 400 }
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        View details
                        <motion.span
                          animate={{
                            x: isHovered === product.id ? 3 : 0,
                            transition: { type: 'spring', stiffness: 500 }
                          }}
                        >
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </motion.span>
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
        
        {recentlyViewed.length > 4 && (
          <div className="mt-10 text-center">
            <motion.button 
              className="px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center mx-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Load More
              <ArrowRight className="w-4 h-4 ml-2" />
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentlyViewed;
