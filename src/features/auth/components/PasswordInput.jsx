// React
import React, { useState, forwardRef } from 'react';

export const PasswordInput = forwardRef(
    (
        {
            id,
            label,
            placeholder = '••••••••',
            autoComplete = 'current-password',
            required = false,
            error,
            ...rest
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const hasError = Boolean(error);
        const errorId = `${id}-error`;

        const togglePasswordVisibility = () => {
            setShowPassword((prev) => !prev);
        };

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
                <div className="relative flex items-center">
                    <input
                        ref={ref}
                        id={id}
                        name={id}
                        type={showPassword ? 'text' : 'password'}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                        aria-invalid={hasError}
                        aria-describedby={hasError ? errorId : undefined}
                        className={`w-full pl-4 pr-11 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 text-sm transition-all duration-200 ${hasError
                                ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500/20'
                                : 'border-slate-200 dark:border-slate-700/80 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent'
                            }`}
                        {...rest}
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? (
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.04 10.04 0 013.682-.763c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                            </svg>
                        )}
                    </button>
                </div>
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

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;