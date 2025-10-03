import { motion } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Fashion Enthusiast',
    content: 'The quality of the products is outstanding! I always get compliments when I wear their clothes. The materials are premium and the fit is perfect every time.',
    rating: 5,
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    date: '2 days ago'
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Loyal Customer',
    content: 'Excellent customer service and fast shipping. Will definitely shop here again! The team went above and beyond to help with my order.',
    rating: 5,
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    date: '1 week ago'
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'First-time Buyer',
    content: 'I was hesitant to order online, but the sizing guide was spot on! The quality exceeded my expectations. Will be a returning customer for sure.',
    rating: 5,
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    date: '3 days ago'
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Frequent Shopper',
    content: 'Their return policy is amazing and the quality is consistent. I\'ve ordered multiple times and never been disappointed.',
    rating: 4,
    image: 'https://randomuser.me/api/portraits/men/75.jpg',
    date: '5 days ago'
  }
];

const TestimonialCard = ({ testimonial, index }) => (
  <motion.div
    key={testimonial.id}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1]
      }
    }}
    viewport={{ once: true, margin: "-50px" }}
    whileHover={{ 
      y: -5,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
      transition: { duration: 0.3 }
    }}
    className="bg-white p-6 rounded-2xl shadow-sm h-full flex flex-col border border-gray-100"
  >
    <div className="flex items-start mb-6">
      <div className="relative">
        <img
          className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow-md"
          src={testimonial.image}
          alt={testimonial.name}
        />
        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="ml-4 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
            <p className="text-sm text-emerald-600">{testimonial.role}</p>
          </div>
          <span className="text-xs text-gray-400">{testimonial.date}</span>
        </div>
        <div className="flex items-center mt-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-200'}`}
              fill={i < testimonial.rating ? 'currentColor' : 'none'}
            />
          ))}
          <span className="ml-2 text-xs text-gray-400">({testimonial.rating}.0)</span>
        </div>
      </div>
    </div>
    
    <div className="relative flex-1">
      <Quote className="absolute -top-1 left-0 w-6 h-6 text-emerald-50" />
      <p className="text-gray-600 pl-6 relative z-10 italic">"{testimonial.content}"</p>
    </div>
    
    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center">
      <div className="flex -space-x-2">
        {[1, 2, 3].map((item) => (
          <img
            key={item}
            className="w-8 h-8 rounded-full border-2 border-white"
            src={`https://randomuser.me/api/portraits/${item % 2 === 0 ? 'men' : 'women'}/${Math.floor(Math.random() * 50)}.jpg`}
            alt={`Customer ${item}`}
          />
        ))}
      </div>
      <span className="ml-3 text-sm text-gray-500">+12 others purchased this</span>
    </div>
  </motion.div>
);

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(2);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + itemsPerPage, testimonials.length - itemsPerPage));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - itemsPerPage, 0));
  };

  const isStartDisabled = currentIndex === 0;
  const isEndDisabled = currentIndex >= testimonials.length - itemsPerPage;

  // Update items per page on resize
  useState(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setItemsPerPage(1);
      else setItemsPerPage(2);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-emerald-600 bg-emerald-100 rounded-full mb-4">
            CUSTOMER TESTIMONIALS
          </span>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Trusted by Thousands of Happy Customers
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our customers have to say about their shopping experience.
          </p>
        </motion.div>

        <div className="relative">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={testimonial.id} className="w-full px-3 flex-shrink-0" style={{ width: `${100 / itemsPerPage}%` }}>
                  <TestimonialCard testimonial={testimonial} index={index} />
                </div>
              ))}
            </div>
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
                ✍️
              </motion.span>
              <span className="ml-2">Write a Review</span>
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
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
