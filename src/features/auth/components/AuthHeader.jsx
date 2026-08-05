// React
import React from 'react';

export const AuthHeader = ({ title, subtitle }) => {
    return (
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
            {/* Application Logo Placeholder */}
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
                <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
            </div>

            {/* Brand Name */}
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                ZainOn
            </span>

            {/* Title & Subtitle */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
            </h1>
            {subtitle && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                    {subtitle}
                </p>
            )}
        </div>
    );
};

export default AuthHeader;