import { motion, useAnimation } from 'framer-motion';
import { Users, ShoppingBag, Award, Truck, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaPaypal } from 'react-icons/fa';
import { SiApplepay } from 'react-icons/si';

const stats = [
  { 
    id: 1, 
    name: 'Happy Customers', 
    value: '10,000+', 
    icon: Users,
    description: 'Satisfied customers and counting',
    color: 'emerald',
    delay: 0.1
  },
  { 
    id: 2, 
    name: 'Products Sold', 
    value: '50,000+', 
    icon: ShoppingBag,
    description: 'Quality items purchased',
    color: 'indigo',
    delay: 0.2
  },
  { 
    id: 3, 
    name: 'Awards Won', 
    value: '15+', 
    icon: Award,
    description: 'Industry recognition',
    color: 'amber',
    delay: 0.3
  },
  { 
    id: 4, 
    name: 'Fast Shipping', 
    value: '24/7', 
    icon: Truck,
    description: 'Delivery support',
    color: 'sky',
    delay: 0.4
  }
];

const AnimatedNumber = ({ value }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.5
  });
  const controls = useAnimation();

  useEffect(() => {
    if (inView) {
      controls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.5 }
      });
    }
  }, [inView, controls]);

  return (
    <motion.span 
      ref={ref}
      animate={controls}
      className="inline-block"
    >
      {value}
    </motion.span>
  );
};

const StatCard = ({ stat, index }) => {
  const Icon = stat.icon;
  const colorVariants = {
    emerald: 'from-emerald-400 to-teal-500',
    indigo: 'from-indigo-500 to-blue-500',
    amber: 'from-amber-400 to-orange-500',
    sky: 'from-sky-400 to-cyan-500'
  };

  return (
    <motion.div
      key={stat.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.6, 
          delay: stat.delay,
          ease: [0.4, 0, 0.2, 1]
        }
      }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ 
        y: -5,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
        transition: { duration: 0.3 }
      }}
      className="relative overflow-hidden group bg-white p-6 rounded-2xl shadow-sm h-full flex flex-col items-center text-center border border-gray-100"
    >
      <motion.div 
        className={`absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-br ${colorVariants[stat.color]} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}
        whileHover={{ scale: 1.5 }}
      />
      
      <div className="relative z-10">
        <motion.div 
          className={`w-16 h-16 rounded-2xl mb-5 flex items-center justify-center mx-auto bg-gradient-to-br ${colorVariants[stat.color]} text-white shadow-lg`}
          whileHover={{ 
            rotate: [0, 10, -10, 0],
            transition: { duration: 0.5 }
          }}
        >
          <Icon className="w-7 h-7" />
        </motion.div>
        
        <motion.h3 
          className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ 
            opacity: 1, 
            y: 0,
            transition: { 
              delay: stat.delay + 0.2,
              duration: 0.5 
            }
          }}
          viewport={{ once: true }}
        >
          <AnimatedNumber value={stat.value} />
          {index === 3 && <span className="text-sm font-normal ml-1 text-gray-400">hours</span>}
        </motion.h3>
        
        <h4 className="text-lg font-semibold text-gray-800 mb-1">{stat.name}</h4>
        <p className="text-gray-500 text-sm">{stat.description}</p>
      </div>
      
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        initial={{ width: 0 }}
        whileInView={{ 
          width: '100%',
          transition: { 
            delay: stat.delay + 0.4,
            duration: 1.5,
            ease: 'easeInOut'
          }
        }}
        viewport={{ once: true }}
      />
    </motion.div>
  );
};

const SocialProof = () => {
  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -left-10 -bottom-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -right-20 top-1/4 w-72 h-72 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-emerald-600 bg-emerald-100 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 fill-current" />
            TRUSTED BY THOUSANDS
          </span>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Why Customers Love Shopping With Us
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us for quality products and exceptional service.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatCard key={stat.id} stat={stat} index={index} />
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <motion.div 
            className="inline-flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ 
              opacity: 1, 
              scale: 1,
              transition: { delay: 0.5 }
            }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Truck className="w-4 h-4 mr-2" />
            <span>Free shipping on orders over $50</span>
          </motion.div>
          
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {[
              { 
                name: 'Visa', 
                icon: <FaCcVisa className="w-6 h-6" style={{ color: '#1A1F71' }} /> 
              },
              { 
                name: 'Mastercard', 
                icon: <FaCcMastercard className="w-6 h-6" style={{ color: '#EB001B' }} /> 
              },
              { 
                name: 'Amex', 
                icon: <FaCcAmex className="w-6 h-6" style={{ color: '#006FCF' }} /> 
              },
              { 
                name: 'PayPal', 
                icon: <FaPaypal className="w-6 h-6" style={{ color: '#003087' }} /> 
              },
              { 
                name: 'Apple Pay', 
                icon: <SiApplepay className="w-6 h-6" style={{ color: '#000000' }} /> 
              }
            ].map((method, i) => (
              <motion.div 
                key={method.name}
                className="bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-100 text-gray-700 text-sm font-medium flex items-center gap-2 hover:shadow-md transition-shadow duration-200"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { 
                    delay: 0.6 + (i * 0.1),
                    duration: 0.3 
                  }
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -2, 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  backgroundColor: 'rgba(0, 0, 0, 0.01)'
                }}
              >
                <span className="text-xl">{method.icon}</span>
                <span className="font-medium">{method.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
