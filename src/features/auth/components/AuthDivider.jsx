// React
import React from 'react';

export const AuthDivider = () => {
    return (
        <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            <span className="absolute bg-white dark:bg-slate-900 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                OR
            </span>
        </div>
    );
};

export default AuthDivider;