import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProductStore } from '../stores/useProductStore';
import Hero from '../components/home/Hero';
import CategoryGrid from '../components/CategoryGrid';
import FeaturedProducts from '../components/FeaturedProducts';
import LimitedTimeOffer from '../components/home/sections/LimitedTimeOffer';
import TrendingNow from '../components/home/sections/TrendingNow';
import Testimonials from '../components/home/sections/Testimonials';
import SocialProof from '../components/home/sections/SocialProof';
import RecentlyViewed from '../components/home/sections/RecentlyViewed';
import Newsletter from '../components/home/sections/Newsletter';

const HomePage = () => {
  const { fetchFeaturedProducts, products, isLoading } = useProductStore();

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />
      <main>
        {/* Categories Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Shop by Category
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                Explore our wide range of premium products
              </p>
            </motion.div>
            <CategoryGrid />
          </div>
        </section>

        {/* Limited Time Offer Section */}
        <LimitedTimeOffer />

        {/* Trending Now Section */}
        <TrendingNow products={products} />

        {/* Featured Products Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Featured Products
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                Discover our handpicked selection of premium items
              </p>
            </motion.div>
            <FeaturedProducts featuredProducts={products} />
          </div>
        </section>

        {/* Testimonials Section */}
        <Testimonials />

        {/* Social Proof Section */}
        <SocialProof />

        {/* Recently Viewed Section */}
        <RecentlyViewed />

        {/* Newsletter Section */}
        <Newsletter />

       
      </main>
    </div>
  );
};

export default HomePage;
