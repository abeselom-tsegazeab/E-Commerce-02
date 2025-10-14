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
  onToggleSidebar={toggleSidebar}  // Make sure this is being passed
  isSidebarOpen={isSidebarOpen}
  theme={theme}
  onThemeToggle={toggleTheme}
  className={`flex items-center transition-all duration-200 ${
    isSidebarOpen ? 'w-[calc(100%-16rem)]' : 'w-full'
  } ml-auto`}
/>
        
        {/* Main content area where child routes will be rendered */}
      <main className={`flex-1 overflow-y-auto px-4 md:px-8 py-6 bg-gray-50 dark:bg-gray-900/50 transition-all duration-200 ${
  isSidebarOpen 
    ? 'w-[calc(100%-16rem)]'  // 100% - sidebar width (16rem)
    : 'w-[calc(100%-4rem)]'   // 100% - collapsed sidebar width (4rem)
} ml-auto`}>
  <div className="w-full max-w-full mx-auto">
    <Outlet />
  </div>
</main>
      </div>
    </div>
  );
};

export default AdminLayout;