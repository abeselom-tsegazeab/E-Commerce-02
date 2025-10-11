import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiPhone, FiSave, FiLogOut, FiEdit2, FiImage } from 'react-icons/fi';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardHover = {
  hover: {
    y: -5,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 10
    }
  }
};

const avatarHover = {
  hover: {
    scale: 1.05,
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 0.6,
      ease: 'easeInOut'
    }
  }
};

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=10b981&color=fff`
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing) return;
    
    setIsLoading(true);
    try {
      await updateUser(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('avatar', file);
      
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update avatar');
      }

      if (data.user) {
        updateUser(data.user);
        toast.success('Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error(error.message || 'Failed to update profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
    >
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <motion.div 
          variants={fadeIn}
          className="relative bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl overflow-hidden shadow-xl transition-all duration-300"
        >
          <div className="h-40 bg-gradient-to-r from-emerald-600 to-teal-700" />
          
          <div className="px-6 pb-8 relative -mt-16">
            <div className="relative group">
              <motion.div 
                className="relative w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-2xl mx-auto overflow-hidden bg-white"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                variants={avatarHover}
                whileHover="hover"
                style={{
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  borderWidth: '4px',
                  borderColor: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                <motion.img 
                  src={formData.avatar} 
                  alt={formData.name} 
                  className="w-full h-full object-cover"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
                <AnimatePresence>
                  {isEditing && isHovered && (
                    <motion.label 
                      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <FiEdit2 className="w-6 h-6 text-white" />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </motion.label>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
            
            <div className="mt-4 text-center">
              <motion.h1 
                className="text-2xl font-bold text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {formData.name}
              </motion.h1>
              <motion.p 
                className="text-emerald-100 mt-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {formData.email}
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Profile Content */}
        <motion.div 
          variants={fadeIn}
          className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Personal Information
              </h2>
              {!isEditing ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                >
                  <FiEdit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </motion.button>
              ) : (
                <div className="flex space-x-3">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=10b981&color=fff`
                      });
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 flex items-center"
                  >
                    <FiSave className="mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <motion.div 
                variants={staggerContainer}
                className="space-y-6"
              >
                <motion.div 
                  variants={fadeIn}
                  className="space-y-1"
                >
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <FiUser className="inline-block mr-2 text-emerald-500" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm disabled:opacity-70 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </motion.div>

                <motion.div 
                  variants={fadeIn}
                  className="space-y-1"
                >
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <FiMail className="inline-block mr-2 text-emerald-500" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm disabled:opacity-70 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </motion.div>

                <motion.div 
                  variants={fadeIn}
                  className="space-y-1"
                >
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <FiPhone className="inline-block mr-2 text-emerald-500" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm disabled:opacity-70 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    placeholder="+1 (555) 000-0000"
                  />
                </motion.div>
              </motion.div>
            </form>

            <motion.div 
              variants={fadeIn}
              className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-end">
                <motion.button
                  onClick={logout}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FiLogOut className="mr-2" />
                  Sign Out
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
