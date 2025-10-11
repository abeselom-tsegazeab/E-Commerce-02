// src/admin/components/shared/Sidebar/constants.js
import { 
  FiHome, 
  FiShoppingBag, 
  FiUsers, 
  FiDollarSign, 
  FiSettings, 
  FiPieChart,
  FiTag
} from 'react-icons/fi';

export const navItems = [
  { 
    icon: <FiHome className="w-5 h-5" />, 
    text: 'Dashboard', 
    path: '/admin/dashboard',
    badge: null
  },
  { 
    icon: <FiShoppingBag className="w-5 h-5" />, 
    text: 'Products', 
    path: '/admin/products',
    badge: '12'
  },
  { 
    icon: <FiTag className="w-5 h-5" />, 
    text: 'Categories', 
    path: '/admin/categories',
    badge: '5'
  },
  { 
    icon: <FiDollarSign className="w-5 h-5" />, 
    text: 'Orders', 
    path: '/admin/orders',
    badge: '24'
  },
  { 
    icon: <FiUsers className="w-5 h-5" />, 
    text: 'Customers', 
    path: '/admin/customers',
    badge: '1.2k'
  },
  { 
    icon: <FiPieChart className="w-5 h-5" />, 
    text: 'Analytics', 
    path: '/admin/analytics',
    badge: null
  },
  { 
    icon: <FiSettings className="w-5 h-5" />, 
    text: 'Settings', 
    path: '/admin/settings',
    badge: null
  }
];

export const containerVariants = {
  open: { 
    width: '280px',
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 30 
    } 
  },
  closed: { 
    width: '80px',
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 30,
      delay: 0.1
    } 
  }
};

export const itemVariants = {
  open: {
    opacity: 1,
    x: 0,
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 25 
    }
  },
  closed: { 
    opacity: 0, 
    x: -20,
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 25 
    }
  }
};