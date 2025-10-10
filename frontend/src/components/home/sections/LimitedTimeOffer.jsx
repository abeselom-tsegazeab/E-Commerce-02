import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, Tag, Truck, ChevronRight } from 'lucide-react';

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newSeconds = prev.seconds - 1;
        const newMinutes = newSeconds < 0 ? prev.minutes - 1 : prev.minutes;
        const newHours = newMinutes < 0 ? prev.hours - 1 : prev.hours;
        
        return {
          hours: newHours < 0 ? 23 : newHours,
          minutes: newMinutes < 0 ? 59 : newMinutes,
          seconds: newSeconds < 0 ? 59 : newSeconds
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center space-x-2 sm:space-x-4">
      <div className="text-center group">
        <motion.div 
          className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-lg px-3 py-2 w-16 sm:w-20 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5"
          whileHover={{ scale: 1.05 }}
        >
          {String(timeLeft.hours).padStart(2, '0')}
        </motion.div>
        <span className="text-xs font-medium text-gray-600 mt-1 group-hover:text-indigo-600 transition-colors duration-300">HOURS</span>
      </div>
      <div className="text-2xl font-bold text-indigo-400 -mt-4 group-hover:text-indigo-600 transition-colors duration-300">:</div>
      <div className="text-center group">
        <motion.div 
          className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-lg px-3 py-2 w-16 sm:w-20 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5"
          whileHover={{ scale: 1.05 }}
        >
          {String(timeLeft.minutes).padStart(2, '0')}
        </motion.div>
        <span className="text-xs font-medium text-gray-600 mt-1 group-hover:text-indigo-600 transition-colors duration-300">MINUTES</span>
      </div>
      <div className="text-2xl font-bold text-indigo-400 -mt-4 group-hover:text-indigo-600 transition-colors duration-300">:</div>
      <div className="text-center group">
        <motion.div 
          className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-lg px-3 py-2 w-16 sm:w-20 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5"
          whileHover={{ scale: 1.05 }}
        >
          {String(timeLeft.seconds).padStart(2, '0')}
        </motion.div>
        <span className="text-xs font-medium text-gray-600 mt-1 group-hover:text-indigo-600 transition-colors duration-300">SECONDS</span>
      </div>
    </div>
  );
};

const OfferCard = ({ icon, title, discount, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay: index * 0.15 }}
    whileHover={{ 
      y: -8, 
      boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.1), 0 10px 10px -5px rgba(79, 70, 229, 0.04)',
      borderColor: 'rgba(99, 102, 241, 0.3)'
    }}
    className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden hover:border-indigo-300"
  >
    <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6">
      {React.cloneElement(icon, {
        className: `${icon.props.className} transition-transform duration-300 group-hover:scale-110`
      })}
    </div>
    <div className="mt-2">
      <span className="text-xs font-medium text-gray-500">{title}</span>
      <h3 className="text-2xl font-bold text-gray-900 mt-1">{discount}</h3>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
      <button className="mt-4 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-all duration-300 group-hover:font-semibold">
        Shop now
        <ChevronRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  </motion.div>
);

const LimitedTimeOffer = () => {
  const offers = [
    { 
      id: 1, 
      title: 'FLASH SALE', 
      discount: '50% OFF', 
      description: 'On selected summer collection',
      icon: <Zap className="w-5 h-5 text-yellow-500" />
    },
    { 
      id: 2, 
      title: 'FREE SHIPPING', 
      discount: 'ON $50+', 
      description: 'Limited time only',
      icon: <Truck className="w-5 h-5 text-blue-500" />
    },
    { 
      id: 3, 
      title: 'NEW CUSTOMERS', 
      discount: '20% OFF', 
      description: 'First purchase with code WELCOME20',
      icon: <Tag className="w-5 h-5 text-purple-500" />
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full mb-4">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            LIMITED TIME OFFER
          </span>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Don't Miss Out on These Exclusive Deals
          </h2>
          <div className="mt-6 mb-8">
            <CountdownTimer />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {offers.map((offer, index) => (
            <OfferCard key={offer.id} {...offer} index={index} />
          ))}
        </div>
        
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.button 
            className="group relative inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-full overflow-hidden"
            whileHover={{
              scale: 1.05,
              boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3), 0 4px 6px -2px rgba(99, 102, 241, 0.2)'
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
                🎯
              </motion.span>
              <span className="ml-2">Shop All Deals</span>
            </span>
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100"
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
        </motion.div>
      </div>
    </section>
  );
};

export default LimitedTimeOffer;