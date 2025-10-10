import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  LayoutDashboard, 
  LogOut, 
  ChevronDown,
  Settings,
  User as UserIcon,
  HelpCircle,
  CreditCard,
  Shield
} from 'lucide-react';
import { toast } from 'react-toastify';

const menuItemVariants = {
  closed: { 
    opacity: 0,
    y: -10,
    transition: {
      y: { stiffness: 1000, velocity: -100 }
    }
  },
  open: {
    opacity: 1,
    y: 0,
    transition: {
      y: { stiffness: 1000, velocity: -100 }
    }
  }
};

const UserMenu = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    {
      label: 'Profile',
      icon: <UserIcon size={18} className="text-gray-600" />,
      action: () => navigate('/profile'),
      divider: false
    },
    ...(isAdmin ? [{
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} className="text-emerald-500" />,
      action: () => navigate('/admin/dashboard'),
      divider: true
    }] : []),
    {
      label: 'Settings',
      icon: <Settings size={18} className="text-blue-500" />,
      action: () => navigate('/settings'),
      divider: false
    },
    {
      label: 'Billing',
      icon: <CreditCard size={18} className="text-purple-500" />,
      action: () => navigate('/billing'),
      divider: false
    },
    {
      label: 'Help & Support',
      icon: <HelpCircle size={18} className="text-amber-500" />,
      action: () => navigate('/support'),
      divider: true
    },
    {
      label: 'Logout',
      icon: <LogOut size={18} className="text-red-500" />,
      action: () => {
        console.log('Logout button clicked in UserMenu');
        if (typeof onLogout === 'function') {
          console.log('Calling onLogout from UserMenu');
          onLogout();
        } else {
          console.error('onLogout is not a function');
          toast.error('Logout functionality not available');
        }
      },
      divider: false
    }
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center space-x-1 p-2 rounded-full transition-all duration-200 ${
          isOpen ? 'bg-gray-100' : 'hover:bg-gray-50'
        }`}
        aria-label="User Menu"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 font-medium">
          {user?.name?.[0]?.toUpperCase() || <User size={18} />}
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ 
              type: 'spring',
              damping: 25,
              stiffness: 500,
              mass: 0.5
            }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User info section */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 font-medium">
                  {user?.name?.[0]?.toUpperCase() || <User size={18} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {menuItems.map((item, index) => (
                <div key={index}>
                  <motion.button
                    variants={menuItemVariants}
                    animate="open"
                    exit="closed"
                    className={`w-full px-4 py-2.5 text-sm flex items-center space-x-3 text-left hover:bg-gray-50 transition-colors duration-150 ${
                      item.label === 'Logout' ? 'text-red-600' : 'text-gray-700'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      item.action?.();
                      setIsOpen(false);
                    }}
                  >
                    <span className="flex-shrink-0">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </motion.button>
                  {item.divider && <div className="border-t border-gray-100 my-1"></div>}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-2.5 text-xs text-gray-500 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <Shield size={14} className="text-gray-400" />
                <span>Secure Connection</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
