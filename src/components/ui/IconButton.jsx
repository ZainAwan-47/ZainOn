// React
import React from 'react';

export const IconButton = ({
    children,
    onClick,
    title,
    disabled = false,
    variant = 'ghost',
    size = 'md',
}) => {
    const sizeClasses = {
        sm: 'p-1.5 text-xs',
        md: 'p-2 text-sm',
        lg: 'p-2.5 text-base',
    };

    const variantClasses = {
        ghost:
            'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
        danger:
            'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300',
        primary:
            'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-md shadow-indigo-600/20',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            disabled={disabled}
            aria-label={title}
            className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0`}
        >
            {children}
        </button>
    );
};

export default IconButton;