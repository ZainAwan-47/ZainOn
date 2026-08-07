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
            'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] active:scale-95',
        danger:
            'text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 hover:opacity-90 active:scale-95',
        primary:
            'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:scale-95 shadow-md shadow-[var(--color-primary)]/25',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            disabled={disabled}
            aria-label={title}
            className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center shrink-0 cursor-pointer`}
        >
            {children}
        </button>
    );
};

export default IconButton;