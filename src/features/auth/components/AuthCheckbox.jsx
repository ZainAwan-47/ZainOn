// React
import React, { forwardRef } from 'react';

export const AuthCheckbox = forwardRef(
    ({ id, label, error, ...rest }, ref) => {
        return (
            <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                        ref={ref}
                        id={id}
                        name={id}
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-slate-800 transition-colors cursor-pointer"
                        {...rest}
                    />
                    <label
                        htmlFor={id}
                        className="text-xs font-medium text-slate-600 dark:text-slate-300 select-none cursor-pointer"
                    >
                        {label}
                    </label>
                </div>
                {error && (
                    <p role="alert" className="text-xs text-rose-500 dark:text-rose-400">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

AuthCheckbox.displayName = 'AuthCheckbox';

export default AuthCheckbox;