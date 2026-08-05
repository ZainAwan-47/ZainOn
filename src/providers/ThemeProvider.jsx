// React
import React from 'react';

// Context
import { ThemeContext } from '../context/ThemeContext';

export const ThemeProvider = ({ children }) => {
    return (
        <ThemeContext.Provider value={null}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;