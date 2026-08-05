// React
import React from 'react';

// Context
import { AuthContext } from '../context/AuthContext';

export const AuthProvider = ({ children }) => {
    return (
        <AuthContext.Provider value={null}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;