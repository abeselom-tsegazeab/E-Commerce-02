import { motion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import ProductCard from '../../ProductCard';
import { useEffect, useState } from 'react';

const RecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    // Mock data - in a real app, you would get this from local storage or your backend
    const mockData = [
      {
        id: 101,
        name: 'Classic White Shirt',
        price: 49.99,
        image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1025&q=80',
        rating: 4.5
      },
      {
        id: 102,
        name: 'Slim Fit Jeans',
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1026&q=80',
        rating: 4.2
      }
    ];
    setRecentlyViewed(mockData);
  }, []);

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-indigo-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Recently Viewed</h2>
          </div>
          <button className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentlyViewed.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
