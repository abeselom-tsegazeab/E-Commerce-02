import { useEffect, useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";

const FeaturedProducts = ({ featuredProducts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  const { addToCart } = useCartStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerPage(1);
      else if (window.innerWidth < 1024) setItemsPerPage(2);
      else if (window.innerWidth < 1280) setItemsPerPage(3);
      else setItemsPerPage(4);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => Math.min(prevIndex + itemsPerPage, featuredProducts.length - itemsPerPage));
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - itemsPerPage, 0));
  };

  const isStartDisabled = currentIndex === 0;
  const isEndDisabled = currentIndex >= featuredProducts.length - itemsPerPage;

  return (
    <section className="py-16 bg-gradient-to-br from-emerald-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-emerald-600 bg-emerald-100 rounded-full mb-4">
            <Star className="w-3.5 h-3.5 mr-1.5 fill-current" />
            FEATURED COLLECTION
          </span>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Our Featured Products
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Carefully curated selection of our best-selling items
          </p>
        </motion.div>

        <div className="relative">
          <div className="overflow-hidden">
            <motion.div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {featuredProducts?.map((product) => (
                <motion.div 
                  key={product._id} 
                  className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-3 py-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ 
                    y: -8,
                    transition: { 
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1]
                    }
                  }}
                >
                  <div className='bg-white rounded-2xl shadow-sm overflow-hidden h-full flex flex-col group hover:shadow-lg transition-all duration-300 border border-gray-100'>
                    <div className='relative overflow-hidden'>
                      <img
                        src={product.image}
                        alt={product.name}
                        className='w-full h-60 object-cover transition-transform duration-500 group-hover:scale-105'
                      />
                      <motion.button
                        onClick={() => addToCart(product)}
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-emerald-600 font-medium py-2.5 px-6 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center whitespace-nowrap"
                        whileHover={{ scale: 1.05, backgroundColor: "#059669", color: "white" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ShoppingCart className='w-4 h-4 mr-2' />
                        Add to Cart
                      </motion.button>
                      {product.discount && (
                        <span className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                    <div className='p-5 flex flex-col flex-grow'>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className='text-lg font-semibold text-gray-900 line-clamp-2'>{product.name}</h3>
                        <div className="flex items-center bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-1 rounded">
                          <Star className="w-3 h-3 fill-current mr-1" />
                          {product.rating || '4.8'}
                        </div>
                      </div>
                      <div className="mt-auto pt-2">
                        <div className="flex items-baseline">
                          <span className='text-emerald-600 font-bold text-xl'>${product.price.toFixed(2)}</span>
                          {product.originalPrice && (
                            <span className='text-gray-400 text-sm line-through ml-2'>${product.originalPrice.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.button
            onClick={prevSlide}
            disabled={isStartDisabled}
            className={`absolute top-1/2 -left-5 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full shadow-md ${
              isStartDisabled 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
            } transition-all duration-300`}
            whileHover={!isStartDisabled ? { scale: 1.1, boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)' } : {}}
            whileTap={!isStartDisabled ? { scale: 0.9 } : {}}
          >
            <ChevronLeft className='w-5 h-5' />
          </motion.button>

          <motion.button
            onClick={nextSlide}
            disabled={isEndDisabled}
            className={`absolute top-1/2 -right-5 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full shadow-md ${
              isEndDisabled 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
            } transition-all duration-300`}
            whileHover={!isEndDisabled ? { scale: 1.1, boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)' } : {}}
            whileTap={!isEndDisabled ? { scale: 0.9 } : {}}
          >
            <ChevronRight className='w-5 h-5' />
          </motion.button>
        </div>

        <div className="flex justify-center mt-12">
          <motion.button 
            className="group relative inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-full overflow-hidden"
            whileHover={{
              scale: 1.05,
              boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.3), 0 4px 6px -2px rgba(5, 150, 105, 0.2)'
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
                ✨
              </motion.span>
              <span className="ml-2">View All Products</span>
            </span>
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100"
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
            <ChevronRight className="w-4 h-4 ml-2 relative z-10 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110" />
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
