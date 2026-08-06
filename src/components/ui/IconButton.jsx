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
        md: 'p-2.5 text-sm',
        lg: 'p-3 text-base',
    };

    const variantClasses = {
        ghost:
            'text-slate-400 hover:bg-slate-800/80 hover:text-white active:scale-95',
        danger:
            'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 active:scale-95',
        primary:
            'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/25',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            disabled={disabled}
            aria-label={title}
            className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center shrink-0`}
        >
            {children}
        </button>
    );
};

export default IconButton;