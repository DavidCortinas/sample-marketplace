import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // This will only run on the client side
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false; // Default for server-side rendering
  });

  useEffect(() => {
    // This effect runs after the component mounts on the client side
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(darkModeMediaQuery.matches);
      
      // Listen for changes to the prefers-color-scheme media query
      const mediaQueryListener = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
      };
      darkModeMediaQuery.addListener(mediaQueryListener);
      
      return () => {
        darkModeMediaQuery.removeListener(mediaQueryListener);
      };
    }
  }, []);

  useEffect(() => {
    // Update body class and localStorage when isDarkMode changes
    if (typeof window !== 'undefined') {
      document.body.classList.toggle('dark-theme', isDarkMode);
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return { isDarkMode, toggleTheme };
}
