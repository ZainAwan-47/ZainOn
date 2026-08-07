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
                <label
                    htmlFor={id}
                    className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                    {label} {required && <span className="text-[var(--color-danger)]">*</span>}
                </label>
                <input
                    ref={ref}
                    id={id}
                    name={id}
                    type={type}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? errorId : undefined}
                    className={`w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 text-sm transition-all duration-200 ${hasError
                            ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20'
                            : 'border-[var(--border-color)] focus:ring-[var(--color-primary)] focus:border-transparent'
                        }`}
                    {...rest}
                />
                {hasError && (
                    <p
                        id={errorId}
                        role="alert"
                        className="text-xs text-[var(--color-danger)] mt-1 flex items-center space-x-1"
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