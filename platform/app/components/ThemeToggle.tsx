import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className="pl-4">
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  );
}