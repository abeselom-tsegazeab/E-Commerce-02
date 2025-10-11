import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  const initializeTheme = () => {
    // Check for saved theme preference or fall back to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Only update state if we don't have a saved preference
    if (!savedTheme) {
      const initialTheme = systemPrefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      applyTheme(initialTheme);
    } else {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
    setMounted(true);
  };

  // Apply theme to the document
  const applyTheme = (themeToApply) => {
    const root = document.documentElement;
    
    // Remove any existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(themeToApply);
    
    // Set color scheme for form controls and system UI
    if (themeToApply === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    
    // Save to localStorage
    localStorage.setItem('theme', themeToApply);
  };

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
    
    // Listen for system theme changes (only if no theme preference is set)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!localStorage.getItem('theme')) {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Toggle between dark and light mode
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Don't render the app until we've determined the theme
  if (!mounted) {
    return <div className="hidden"></div>; // Return empty div instead of null
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
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
