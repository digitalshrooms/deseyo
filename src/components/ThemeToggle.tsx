import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Přepnout na světlý motiv' : 'Přepnout na tmavý motiv'}
      className="relative flex items-center w-14 h-7 rounded-full transition-colors duration-300 flex-shrink-0"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
      }}
    >
      <motion.div
        className="flex items-center justify-center w-5 h-5 rounded-full"
        animate={{ x: isDark ? 28 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ backgroundColor: isDark ? '#198379' : '#FBBF24' }}
      >
        {isDark ? <Moon className="w-3 h-3 text-white" /> : <Sun className="w-3 h-3 text-white" />}
      </motion.div>
    </button>
  );
};
