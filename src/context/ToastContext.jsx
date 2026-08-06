// React
import React, { createContext, useContext, useState, useCallback } from 'react';

// Components
import Toast from '../components/ui/Toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, duration);
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastContext;