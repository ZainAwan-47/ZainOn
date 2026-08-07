// React
import React from 'react';

export const Toast = ({ message, type = 'info', onClose }) => {
    if (!message) return null;

    const typeStyles = {
        success: 'bg-[var(--color-success)]/90 border-[var(--color-success)] text-white',
        error: 'bg-[var(--color-danger)]/90 border-[var(--color-danger)] text-white',
        info: 'bg-[var(--color-primary)]/90 border-[var(--color-primary)] text-white',
        amber: 'bg-[var(--color-warning)]/90 border-[var(--color-warning)] text-white',
    };

    const icons = {
        success: (
            <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    };

    return (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-auth-card pointer-events-auto">
            <div
                className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center justify-between space-x-3 transition-all ${typeStyles[type] || typeStyles.info
                    }`}
            >
                <div className="flex items-center space-x-3 min-w-0">
                    {icons[type] || icons.info}
                    <span className="text-xs font-semibold leading-tight truncate">{message}</span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-white/70 hover:text-white focus:outline-none shrink-0 cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Toast;