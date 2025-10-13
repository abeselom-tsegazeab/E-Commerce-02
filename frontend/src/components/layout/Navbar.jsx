import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Menu, 
  X,
  Home,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCartStore } from '../../stores/useCartStore';
import { toast } from 'react-toastify';
import UserMenu from '../UserMenu';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cart } = useCartStore();

  // Handle scroll effect for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu and user menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  // Navigation links
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'About', path: '/about' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  // Handle logout
  const handleLogout = useCallback(async () => {
    console.log('Navbar: Starting logout process');
    try {
      // Call the logout function from useAuth
      await logout();
      
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('isAuthenticated');
      
      // Clear cookies by setting them to expire in the past
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      
      console.log('Navbar: Logout successful, redirecting to login');
      // Force a full page reload to ensure all state is cleared
      window.location.href = '/login';
    } catch (error) {
      console.error('Navbar: Logout error:', error);
      // Still try to clear everything and redirect even if there's an error
      localStorage.removeItem('accessToken');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
    }
  }, [logout]);

  return (
    <>
      {/* Backdrop for mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/80 backdrop-blur-sm shadow-sm py-2' 
            : 'bg-transparent py-4'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2 group">
                <motion.div 
                  className="relative w-8 h-8 md:w-10 md:h-10"
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path 
                      d="M5 8h15l-1.5 10h-12L5 8z" 
                      fill="none" 
                      stroke={scrolled ? '#10B981' : '#FFFFFF'} 
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path 
                      d="M8 8V6a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v2" 
                      fill="none" 
                      stroke={scrolled ? '#10B981' : '#FFFFFF'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle cx="9" cy="19" r="1.5" fill={scrolled ? '#10B981' : '#FFFFFF'} fillOpacity="0.2" stroke={scrolled ? '#10B981' : '#FFFFFF'} strokeWidth="1" />
                    <circle cx="16" cy="19" r="1.5" fill={scrolled ? '#10B981' : '#FFFFFF'} fillOpacity="0.2" stroke={scrolled ? '#10B981' : '#FFFFFF'} strokeWidth="1" />
                    <circle cx="9" cy="19" r="0.5" fill={scrolled ? '#10B981' : '#FFFFFF'} />
                    <circle cx="16" cy="19" r="0.5" fill={scrolled ? '#10B981' : '#FFFFFF'} />
                  </svg>
                </motion.div>
                <motion.span 
                  className={`text-xl font-bold ${
                    scrolled ? 'text-gray-800' : 'text-white'
                  }`}
                >
                  QuantumShop
                </motion.span>
              </Link>
            </div>

            {/* Center - Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                    location.pathname === link.path
                      ? 'text-emerald-500'
                      : scrolled 
                        ? 'text-gray-700 hover:text-emerald-500' 
                        : 'text-white/90 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Cart */}
              <Link
                to="/cart"
                className={`p-2 rounded-full relative ${
                  scrolled 
                    ? 'hover:bg-gray-100 text-gray-700' 
                    : 'hover:bg-white/20 text-white'
                }`}
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {Math.min(cart.length, 99)}
                  </span>
                )}
              </Link>

              {/* User Menu - Show when logged in, otherwise show auth buttons */}
              {user ? (
                <div className="user-menu">
                  <UserMenu 
                    user={user} 
                    onLogout={() => {
                      console.log('Logout initiated from Navbar');
                      handleLogout()
                        .then(() => {
                          console.log('Logout successful, navigating to login');
                          window.location.href = '/login';
                        })
                        .catch(error => {
                          console.error('Logout error in Navbar:', error);
                        });
                    }}
                    key={user._id}
                  />
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link
                    to="/login"
                    state={{ from: location.pathname }}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    state={{ from: location.pathname }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-sm rounded-lg hover:opacity-90 whitespace-nowrap"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-800"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white shadow-2xl z-40 flex flex-col overflow-y-auto"
              style={{ paddingTop: 'calc(1rem + 1.5rem + 1rem)' }}
            >
              <div className="px-6 pt-6 pb-8 space-y-3 flex-1">
                <div className="space-y-1">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.path}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{
                        delay: 0.1 + (index * 0.05),
                        type: 'spring',
                        damping: 15,
                        stiffness: 200
                      }}
                    >
                      <Link
                        to={link.path}
                        className={`block px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-lg text-base font-medium transition-colors ${
                          location.pathname === link.path ? 'text-emerald-500' : ''
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 mt-4">
                  {user ? (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, type: 'spring', damping: 15, stiffness: 200 }}
                    >
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg text-base font-medium transition-colors"
                      >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, type: 'spring', damping: 15, stiffness: 200 }}
                      >
                        <Link
                          to="/login"
                          className="block w-full px-4 py-3 text-emerald-500 hover:bg-emerald-50 rounded-lg text-base font-medium text-center mb-3 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Log In
                        </Link>
                      </motion.div>
                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.35, type: 'spring', damping: 15, stiffness: 200 }}
                      >
                        <Link
                          to="/signup"
                          className="block w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-lg text-base font-medium text-center hover:opacity-90 transition-all transform hover:scale-[1.02]"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </motion.div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Close button */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-700"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-6 h-6" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
};

export default Navbar;