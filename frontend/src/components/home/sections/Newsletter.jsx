import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Bell, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    // Trigger animation when component mounts
    const timer = setTimeout(() => {
      setIsInView(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your newsletter subscription logic here
    console.log('Subscribed with:', email);
    setIsSubscribed(true);
    setEmail('');
    // Reset after 5 seconds
    setTimeout(() => setIsSubscribed(false), 5000);
  };

  // Animation variants
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

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        duration: 0.5
      }
    }
  };

  const floating = {
    initial: { y: 0 },
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        <motion.div 
          className="container mx-auto px-4"
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          variants={container}
        >
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            variants={item}
          >
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-indigo-50 shadow-lg mb-8 relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              variants={item}
            >
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 0.3 } : { opacity: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              />
              <motion.div
                variants={floating}
                initial="initial"
                animate="animate"
              >
                <Mail className="w-8 h-8 text-indigo-600" />
              </motion.div>
              <motion.div 
                className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-900"
                initial={{ scale: 0 }}
                animate={{ 
                  scale: 1,
                  rotate: [0, 20, -20, 10, -10, 0],
                  transition: { 
                    delay: 0.8, 
                    type: 'spring',
                    stiffness: 500,
                    damping: 15
                  } 
                }}
              >
                <Bell className="w-3 h-3" />
              </motion.div>
            </motion.div>

            <motion.h2 
              className="text-4xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { 
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 100,
                  damping: 15
                } 
              }}
            >
              Stay Updated
            </motion.h2>
            
            <motion.p 
              className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { 
                  delay: 0.3,
                  duration: 0.5
                } 
              }}
            >
              Subscribe to our newsletter for the latest updates, exclusive offers, and more.
            </motion.p>
            
            <AnimatePresence mode="wait">
              {isSubscribed ? (
                <motion.div
                  key="success-message"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { 
                      type: 'spring',
                      stiffness: 300,
                      damping: 20
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.95,
                    transition: { duration: 0.2 }
                  }}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 text-green-700 px-6 py-4 rounded-xl shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Thanks for subscribing! Check your email for confirmation.</span>
                </motion.div>
              ) : (
                <motion.form 
                  key="subscription-form"
                  onSubmit={handleSubmit} 
                  className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                      delay: 0.4,
                      duration: 0.5
                    } 
                  }}
                >
                  <motion.div 
                    className="relative flex-grow"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-6 py-4 pr-14 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                      required
                    />
                    <motion.div 
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                      animate={isHovered ? { x: 2 } : { x: 0 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      <Send className="w-5 h-5" />
                    </motion.div>
                  </motion.div>
                  <motion.button
                    type="submit"
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity whitespace-nowrap flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:shadow-indigo-100"
                    whileHover={{ 
                      scale: 1.02,
                      transition: { 
                        type: 'spring',
                        stiffness: 400,
                        damping: 10
                      } 
                    }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <span>Subscribe Now</span>
                    <motion.span
                      animate={isHovered ? { x: 3 } : { x: 0 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.span>
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
            
            <motion.p 
              className="text-sm text-gray-500 mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { 
                  delay: 0.5,
                  duration: 0.5
                } 
              }}
            >
              We respect your privacy. Unsubscribe at any time.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>

      {/* Add global styles for the blob animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 15s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `
      }} />
    </section>
  );
};

export default Newsletter;
