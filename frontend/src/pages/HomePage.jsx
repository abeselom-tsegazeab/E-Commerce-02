import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useRef } from 'react';
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

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const HomePage = () => {
  const { 
    fetchFeaturedProducts, 
    featuredProducts = [], 
    loading: isLoading, 
    error 
  } = useProductStore();
  
  const controlsRef = useRef();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
    fallbackInView: true
  });

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />
      <AnimatePresence>
        <motion.main
          ref={controlsRef}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={container}
        >
          {/* Intersection observer target */}
          <div ref={ref} className="absolute top-20 w-full h-1" />
          {/* Categories Section */}
          <motion.section 
            className="py-16"
            variants={item}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                className="text-center mb-12"
                variants={item}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">Explore our wide range of products</p>
              </motion.div>
              <motion.div variants={item}>
                <CategoryGrid />
              </motion.div>
            </div>
          </motion.section>

          {/* Featured Products */}
          <motion.section 
            className="py-16 bg-white"
            variants={item}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                className="text-center mb-12"
                variants={item}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">Discover our most popular items</p>
              </motion.div>
              <motion.div variants={item}>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12 text-red-500">
                    <p>Failed to load featured products. Please try again later.</p>
                  </div>
                ) : (
                  <FeaturedProducts featuredProducts={featuredProducts} />
                )}
              </motion.div>
            </div>
          </motion.section>

          {/* Other sections with similar motion components */}
          <motion.div variants={item}>
            <LimitedTimeOffer />
          </motion.div>
          
          <motion.div variants={item}>
            <TrendingNow />
          </motion.div>
          
          <motion.div variants={item}>
            <Testimonials />
          </motion.div>
          
          <motion.div variants={item}>
            <SocialProof />
          </motion.div>
          
          <motion.div variants={item}>
            <RecentlyViewed />
          </motion.div>
          
          <motion.div variants={item}>
            <Newsletter />
          </motion.div>
        </motion.main>
      </AnimatePresence>
    </div>
  );
};

export default HomePage;