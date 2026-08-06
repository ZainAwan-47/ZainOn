// React
import React, { forwardRef } from 'react';

export const AuthInput = forwardRef(
    (
        {
            id,
            label,
            type = 'text',
            placeholder,
            autoComplete,
            required = false,
            error,
            ...rest
        },
        ref
    ) => {
        const hasError = Boolean(error);
        const errorId = `${id}-error`;

        return (
            <div className="flex flex-col space-y-1.5">
                {label && (
                    <label
                        htmlFor={id}
                        className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between"
                    >
                        <span>
                            {label} {required && <span className="text-rose-500">*</span>}
                        </span>
                    </label>
                )}
                <input
                    ref={ref}
                    id={id}
                    name={id}
                    type={type}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? errorId : undefined}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 text-sm transition-all duration-200 ${hasError
                            ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-200 dark:border-slate-700/80 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent'
                        }`}
                    {...rest}
                />
                {hasError && (
                    <p
                        id={errorId}
                        role="alert"
                        className="text-xs text-rose-500 dark:text-rose-400 mt-1 flex items-center space-x-1"
                    >
                        <svg
                            className="w-3.5 h-3.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span>{error}</span>
                    </p>
                )}
            </div>
        );
    }
);

AuthInput.displayName = 'AuthInput';

export default AuthInput;