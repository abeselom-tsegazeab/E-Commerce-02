import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GoogleOAuthButton from '../../components/auth/GoogleOAuthButton';
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const from = location.state?.from?.pathname || 
              searchParams.get('redirect') || 
              '/';
  const [formError, setFormError] = useState('');

  useEffect(() => {
    console.log('User state in useEffect:', user);
    if (user && user._id) {
      console.log('User is authenticated, redirecting to:', from);
      // Ensure we're not already on the target page to prevent navigation loops
      if (window.location.pathname !== from) {
        console.log('Navigating to:', from);
        navigate(from, { replace: true });
      } else {
        console.log('Already on target page:', from);
      }
    } else if (user === null) {
      console.log('No user is currently logged in');
    }
  }, [user, navigate, from]);

  useEffect(() => {
    if (error) {
      setFormError(error);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) {
      console.log('Login already in progress, ignoring click');
      return;
    }
    
    setFormError('');
    
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Attempting to log in with email:', email);
      const loginPromise = login({ email, password });
      
      // Set a timeout to check if the promise is stuck
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Login request timed out after 10 seconds'));
        }, 10000);
      });

      const result = await Promise.race([
        loginPromise,
        timeoutPromise
      ]);
      
      if (result) {
        console.log('Login successful, user data:', result);
        console.log('Redirecting to:', from);
        
        // The success toast is now shown in the AuthContext
        // Small delay to ensure state updates before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Navigate to the target page
        navigate(from, { 
          replace: true,
          state: { from: location } // Preserve the current location in history
        });
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        console.error('Error message:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div 
        className="w-full max-w-md mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          variants={itemVariants}
        >
          <div className="p-8">
            <motion.div 
              className="text-center mb-8"
              variants={itemVariants}
            >
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.2 }}
              >
                Welcome Back
              </motion.h1>
              <AnimatePresence>
                {(formError || error) && (
                  <motion.p 
                    className="text-sm text-red-600 mt-2 flex items-center justify-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: 'spring' }}
                  >
                    <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{error ? error : formError}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <motion.div 
                className="space-y-4"
                variants={itemVariants}
              >
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <motion.div 
                    className="relative"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      placeholder="you@example.com"
                    />
                  </motion.div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <motion.div 
                    className="relative"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500 transition-colors" />
                      )}
                    </button>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-center"
                variants={itemVariants}
              >
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 ${
                    isHovered && !isSubmitting ? 'shadow-lg' : 'shadow-md'
                  }`}
                  onHoverStart={() => !isSubmitting && setIsHovered(true)}
                  onHoverEnd={() => !isSubmitting && setIsHovered(false)}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>

            <motion.div 
              className="mt-6"
              variants={itemVariants}
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <GoogleOAuthButton disabled={isSubmitting} />
              </div>
            </motion.div>

            <motion.div 
              className="mt-6 text-center"
              variants={itemVariants}
            >
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;