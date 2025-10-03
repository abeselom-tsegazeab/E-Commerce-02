import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { useRef } from 'react';

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacityBg = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const yText = useTransform(scrollYProgress, [0, 0.5], ["0%", "20%"]);
  const xImage = useTransform(scrollYProgress, [0, 0.5], ["0%", "5%"]);
  const scaleImage = useTransform(scrollYProgress, [0, 0.5], [1, 1.03]);

  return (
    <section 
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Animated Background */}
      <motion.div 
        style={{ y: yBg, opacity: opacityBg }}
        className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuMDgiLz4KPC9zdmc+')]"></div>
        </div>
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-transparent"></div>
      </motion.div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            initial={{
              x: Math.random() * 100 + 'vw',
              y: Math.random() * 100 + 'vh',
              width: Math.random() * 20 + 5 + 'px',
              height: Math.random() * 20 + 5 + 'px',
              opacity: Math.random() * 0.3 + 0.1
            }}
            animate={{
              y: ['0%', '-100%', '0%'],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div 
            style={{ y: yText }}
            className="text-center lg:text-left relative"
          >
            {/* Decorative element */}
            <motion.div 
              className="absolute -top-8 -left-8 w-16 h-16 bg-pink-500/20 rounded-full filter blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6 border border-white/10"
            >
              <Sparkles className="w-5 h-5 text-pink-300 mr-2" />
              <span className="text-sm font-medium text-pink-100">New Collection</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-tight"
            >
              <span className="block text-white">Elevate Your</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-pink-300 to-purple-300">
                Style Journey
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl sm:text-2xl text-gray-300 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              Discover curated collections that blend <span className="text-white font-medium">timeless elegance</span> with contemporary design.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                to="/category/new-arrivals"
                className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium text-white bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <span className="relative z-10 flex items-center">
                  <ShoppingBag className="mr-3 h-5 w-5" />
                  <span className="font-semibold">Shop Now</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
              </Link>
              <Link
                to="/category/sale"
                className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium text-white bg-transparent border-2 border-white/20 hover:border-white/40 rounded-full transition-all duration-300 hover:bg-white/5"
              >
                <span className="relative z-10 flex items-center">
                  <span className="font-medium">View Sale</span>
                  <span className="ml-2 px-2 py-0.5 bg-pink-500/20 text-pink-300 text-xs font-medium rounded-full">-50%</span>
                </span>
              </Link>
            </motion.div>

            <div className="mt-12 flex flex-wrap gap-6 justify-center lg:justify-start">
              {['Free Shipping', 'Secure Payment', '24/7 Support'].map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + (index * 0.1) }}
                  className="flex items-center text-gray-300"
                >
                  <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
                  <span className="text-sm">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Image Content */}
          {/* Image Content - Made smaller and better proportioned */}
<motion.div 
  initial={{ opacity: 0, x: 50 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.8, delay: 0.4 }}
  style={{ x: xImage, scale: scaleImage }}
  className="relative hidden lg:block mt-12 w-4/5 mx-auto"
>
  <div className="relative z-10 rounded-2xl overflow-hidden shadow-xl border-2 border-white/5">
    <img
      src="https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
      alt="Fashion Model"
      className="w-full h-auto max-h-[500px] object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent"></div>
  </div>
</motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: [0.6, 1, 0.6],
          y: [0, 10, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center"
      >
        <span className="text-sm text-white/70 mb-2">Scroll to explore</span>
        <ChevronDown className="h-6 w-6 text-white/60" />
      </motion.div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
    </section>
  );
};

export default Hero;