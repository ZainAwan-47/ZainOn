// React
import React from 'react';

// Utilities
import { formatLastSeen } from '../../utils/dateUtils';

export const PresenceIndicator = ({
    isOnline = false,
    lastSeen = null,
    showText = true,
    size = 'md',
    onlineStatusEnabled = true,
}) => {
    // If user's online status setting is entirely off, display absolutely nothing.
    if (!onlineStatusEnabled) return null;

    const dotSizes = {
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
    };

    const textSizes = {
        sm: 'text-[10px]',
        md: 'text-xs',
        lg: 'text-sm',
    };

    // Force strictly "Offline" if lastSeen is null (hidden by privacy rules)
    const formattedLastSeen = lastSeen ? formatLastSeen(lastSeen) : 'Offline';

    return (
        <div className="flex items-center space-x-1.5 select-none">
            <span
                className={`${dotSizes[size]} rounded-full shrink-0 transition-colors ${isOnline ? 'bg-[var(--color-success)] ring-2 ring-[var(--color-success)]/20' : 'bg-[var(--text-secondary)]'
                    }`}
                aria-hidden="true"
            />
            {showText && (
                <span
                    className={`${textSizes[size]} font-medium ${isOnline ? 'text-[var(--color-success)]' : 'text-[var(--text-secondary)]'
                        }`}
                >
                    {isOnline ? 'Online' : formattedLastSeen}
                </span>
            )}
        </div>
    );
};

export default PresenceIndicator;