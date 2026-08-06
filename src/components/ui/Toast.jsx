// React
import React from 'react';

export const Toast = ({ message, type = 'info', onClose }) => {
    if (!message) return null;

    const typeStyles = {
        success: 'bg-emerald-900/90 border-emerald-600 text-emerald-100',
        error: 'bg-rose-900/90 border-rose-600 text-rose-100',
        info: 'bg-indigo-900/90 border-indigo-600 text-indigo-100',
        amber: 'bg-amber-900/90 border-amber-600 text-amber-100',
    };

    const icons = {
        success: (
            <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="text-slate-400 hover:text-white focus:outline-none shrink-0"
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