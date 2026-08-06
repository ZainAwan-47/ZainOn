// React
import React from 'react';

// Utilities
import { formatLastSeen } from '../../utils/dateUtils';

export const PresenceIndicator = ({
    isOnline = false,
    lastSeen = null,
    showText = true,
    size = 'md',
}) => {
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

    const formattedLastSeen = formatLastSeen(lastSeen);

    return (
        <div className="flex items-center space-x-1.5 select-none">
            <span
                className={`${dotSizes[size]} rounded-full shrink-0 transition-colors ${isOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-500'
                    }`}
                aria-hidden="true"
            />
            {showText && (
                <span
                    className={`${textSizes[size]} font-medium ${isOnline ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                >
                    {isOnline ? 'Online' : formattedLastSeen}
                </span>
            )}
        </div>
    );
};

export default PresenceIndicator;