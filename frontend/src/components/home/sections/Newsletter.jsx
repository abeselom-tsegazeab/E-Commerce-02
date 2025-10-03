import { motion } from 'framer-motion';
import { Mail, Send } from 'lucide-react';
import { useState } from 'react';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your newsletter subscription logic here
    console.log('Subscribed with:', email);
    setIsSubscribed(true);
    setEmail('');
    // Reset after 3 seconds
    setTimeout(() => setIsSubscribed(false), 3000);
  };

  return (
    <section className="py-16 bg-gradient-to-r from-indigo-500 to-purple-600">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 text-white mb-6">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-lg text-indigo-100 mb-8">
            Subscribe to our newsletter for the latest updates, exclusive offers, and more.
          </p>
          
          {isSubscribed ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-sm text-white px-6 py-4 rounded-lg inline-block"
            >
              🎉 Thanks for subscribing! Check your email for confirmation.
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-grow">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-5 py-3 pr-12 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50"
                  required
                />
                <Send className="absolute right-4 top-3.5 text-gray-400" />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-white text-indigo-600 rounded-full font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          )}
          
          <p className="text-sm text-indigo-200 mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
