// React
import React from 'react';

// Providers
import AuthProvider from './AuthProvider';
import ThemeProvider from './ThemeProvider';
// EXACT FIX: Removed CallProvider from here because it is now safely wrapping the MainAppLayout directly.

export const AppProviders = ({ children }) => {
    return (
        <AuthProvider>
            <ThemeProvider>
                {children}
            </ThemeProvider>
        </AuthProvider>
    );
};

export default AppProviders;