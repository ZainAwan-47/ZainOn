// React
import React from 'react';

// Providers
import AuthProvider from './AuthProvider';
import ThemeProvider from './ThemeProvider';
import CallProvider from './CallProvider';

export const AppProviders = ({ children }) => {
    return (
        <AuthProvider>
            <ThemeProvider>
                <CallProvider>{children}</CallProvider>
            </ThemeProvider>
        </AuthProvider>
    );
};

export default AppProviders;