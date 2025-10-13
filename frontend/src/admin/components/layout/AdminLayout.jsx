import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import Sidebar from '../shared/Sidebar/Sidebar';
import Header from '../shared/Header/index';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobileView = window.innerWidth < 768;
      setIsMobile(mobileView);
      // On mobile, start with sidebar closed; on desktop, start with it open
      setIsSidebarOpen(!mobileView);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
        
        {/* Main content area where child routes will be rendered */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;