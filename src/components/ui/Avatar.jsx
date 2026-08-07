// React
import React from 'react';

export const Avatar = ({
    src,
    name = 'User',
    size = 'md',
    isOnline = false,
    showStatus = true,
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10.5 h-10.5 text-sm',
        lg: 'w-12 h-12 text-base',
    };

    const badgeSizes = {
        sm: 'w-2.5 h-2.5 ring-2',
        md: 'w-3 h-3 ring-2',
        lg: 'w-3.5 h-3.5 ring-2',
    };

    const initials = name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="relative inline-block flex-shrink-0 select-none">
            {src ? (
                <img
                    src={src}
                    alt={name}
                    className={`${sizeClasses[size]} rounded-full object-cover border border-[var(--border-color)] shadow-sm transition-opacity hover:opacity-90`}
                />
            ) : (
                <div
                    className={`${sizeClasses[size]} rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center shadow-md shadow-[var(--color-primary)]/15 tracking-wider`}
                >
                    {initials || 'U'}
                </div>
            )}

            {showStatus && (
                <span
                    className={`absolute bottom-0 right-0 ${badgeSizes[size]} rounded-full ring-[var(--bg-surface)] transition-colors ${isOnline ? 'bg-[var(--color-success)]' : 'bg-[var(--text-secondary)]'
                        }`}
                    title={isOnline ? 'Online' : 'Offline'}
                />
            )}
        </div>
    );
};

export default Avatar;