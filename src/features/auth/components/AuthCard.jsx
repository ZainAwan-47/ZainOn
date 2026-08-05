// React
import React from 'react';

export const AuthCard = ({ children }) => {
    return (
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8 transition-colors">
            {children}
        </div>
    );
};

export default AuthCard;