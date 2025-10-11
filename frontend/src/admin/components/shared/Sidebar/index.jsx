// src/admin/components/shared/Sidebar/index.jsx
import { memo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { navItems, containerVariants } from './constants';
import SidebarHeader from './components/SidebarHeader';
import SidebarFooter from './components/SidebarFooter';
import NavItem from './components/NavItem';

const Sidebar = ({ isOpen, onToggle, theme, onThemeToggle }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (isMobileView && isOpen) {
        onToggle(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onToggle]);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleClickOutside = (e) => {
      const sidebar = document.querySelector('.sidebar-container');
      if (sidebar && !sidebar.contains(e.target)) {
        onToggle(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, onToggle]);

  const handleLogout = () => {
    // Handle logout logic here
    console.log('Logout clicked');
  };

  return (
    <motion.aside
      className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg z-50 overflow-hidden flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      variants={containerVariants}
    >
      <SidebarHeader isOpen={isOpen} onToggle={onToggle} />
      
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              text={item.text}
              path={item.path}
              badge={item.badge}
              isOpen={isOpen}
              isActive={location.pathname === item.path}
              onClick={() => isMobile && onToggle(false)}
            />
          ))}
        </ul>
      </nav>
      
      <SidebarFooter 
        isOpen={isOpen} 
        theme={theme} 
        onThemeToggle={onThemeToggle} 
        onLogout={handleLogout} 
      />
    </motion.aside>
  );
};

export default memo(Sidebar);