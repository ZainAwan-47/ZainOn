// React
import React, { memo } from 'react';

// Hooks & Services
import { useNotifications } from '../../hooks/useNotifications';

export const NotificationBell = memo(({ onClick }) => {
    const { unreadCount } = useNotifications();

    const displayCount = unreadCount > 99 ? '99+' : unreadCount;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Notifications"
            className="relative p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-hover)]/60 hover:bg-[var(--bg-surface-hover)] rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 cursor-pointer select-none"
            title="Notifications"
        >
            {/* Bell Icon SVG */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
            </svg>

            {/* Unread Badge */}
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[var(--color-primary)] text-[10px] text-white font-extrabold shrink-0 shadow-sm min-w-[18px] text-center animate-pulse">
                    {displayCount}
                </span>
            )}
        </button>
    );
});

NotificationBell.displayName = 'NotificationBell';
export default NotificationBell;