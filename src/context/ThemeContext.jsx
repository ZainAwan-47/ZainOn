// React
import { createContext, useContext } from 'react';

// Explicit Named Export for ThemeContext
export const ThemeContext = createContext({
    theme: 'system',
    setTheme: () => null,
});

// Custom hook for simple consumption across components
export const useTheme = () => useContext(ThemeContext);