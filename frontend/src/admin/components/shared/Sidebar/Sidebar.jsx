import { useState, useEffect, memo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { navItems } from './constants.jsx';
import SidebarHeader from './components/SidebarHeader';
import NavItem from './components/NavItem';
import SidebarFooter from './components/SidebarFooter';

const MOBILE_BREAKPOINT = 768;

const Sidebar = ({ isOpen, onToggle, theme, onThemeToggle }) => {
  const location = useLocation();
  const isMobileRef = useRef(window.innerWidth < MOBILE_BREAKPOINT);
  const [isMobile, setIsMobile] = useState(isMobileRef.current);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < MOBILE_BREAKPOINT;
      if (isMobileView !== isMobileRef.current) {
        isMobileRef.current = isMobileView;
        setIsMobile(isMobileView);
        // Only update the sidebar state if it's different from the current state
        if (isMobileView && isOpen) {
          onToggle(false);
        } else if (!isMobileView && !isOpen) {
          onToggle(true);
        }
      }
    };
    
    // Set initial state on mount
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [onToggle]);
  
  // Handle manual toggle
  const handleToggle = () => {
    onToggle(!isOpen);
  };

  // Animation variants
  const sidebarVariants = {
    open: { 
      x: 0,
      width: isMobile ? '280px' : '280px',
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
      } 
    },
    closed: { 
      x: isMobile ? '-280px' : 0,
      width: isMobile ? '0' : '80px',
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 35,
      }
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={handleToggle}
        />
      )}
      
      {/* Sidebar */}
      <motion.aside
        className="fixed top-0 left-0 h-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-xl z-40 overflow-hidden flex flex-col border-r border-gray-100 dark:border-gray-700/50"
        initial={isMobile ? 'closed' : 'open'}
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
      >
        <div className="sidebar-container flex-1 flex flex-col h-full">
          <SidebarHeader isOpen={isOpen} onToggle={handleToggle} />
          
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
                />
              ))}
            </ul>
          </nav>

          <SidebarFooter 
            isOpen={isOpen} 
            theme={theme} 
            onThemeToggle={onThemeToggle} 
            onLogout={() => console.log('Logout')} 
          />
        </div>
      </motion.aside>
    </>
  );
};

export default memo(Sidebar);