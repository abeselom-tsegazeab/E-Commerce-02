import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme for admin dashboard
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('adminTheme') || 'dark'; // Default to dark for admin
    setTheme(savedTheme);
    setMounted(true);
  };

  // Toggle between dark and light mode
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('adminTheme', newTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, []);

  // Don't render until theme is loaded
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      isDark: theme === 'dark' 
    }}>
      <div className={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
