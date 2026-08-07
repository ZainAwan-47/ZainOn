// React
import React from 'react';

export const PrimaryButton = ({
    children,
    type = 'submit',
    onClick,
    disabled = false,
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`w-full py-3 px-4 font-semibold rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)] cursor-pointer ${disabled
                    ? 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-color)] cursor-not-allowed shadow-none'
                    : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-lg shadow-[var(--color-primary)]/25'
                }`}
        >
            {children}
        </button>
    );
};

export default PrimaryButton;