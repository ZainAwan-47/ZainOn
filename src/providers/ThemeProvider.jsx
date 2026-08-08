// React
import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';

// Context
import { ThemeContext } from '../context/ThemeContext';

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'navy';
    });

    const applyTheme = useCallback((selectedTheme, enableAnimation = true) => {
        const root = document.documentElement;

        if (enableAnimation) {
            root.classList.add('theme-transition');
        }

        // Clean slate
        root.classList.remove('dark', 'theme-dark', 'theme-navy');

        if (selectedTheme === 'dark') {
            // Apply Pure Black
            root.classList.add('dark', 'theme-dark');
            root.style.colorScheme = 'dark';
        } else if (selectedTheme === 'navy' || selectedTheme === 'system') {
            // Apply Original Navy Blue for System Auto / Navy
            root.classList.add('dark', 'theme-navy');
            root.style.colorScheme = 'dark';
        } else {
            // Apply Light
            root.style.colorScheme = 'light';
        }

        if (enableAnimation) {
            // Cleanly remove the transition utility class after the animation completes
            setTimeout(() => root.classList.remove('theme-transition'), 400);
        }
    }, []);

    useLayoutEffect(() => {
        applyTheme(theme, false);
    }, [theme, applyTheme]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme: (newTheme) => { applyTheme(newTheme, true); setTheme(newTheme); } }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;