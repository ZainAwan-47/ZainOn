// React
import React from 'react';

// Hooks & Services
import { useNotifications } from '../../hooks/useNotifications';

// Components
import NotificationItem from './NotificationItem';

const NotificationPanel = ({ onClose, onNavigate, onMarkAllRead }) => {
    const {
        notifications,
        unreadCount,
        loading,
        error,
        deleteNotification,
    } = useNotifications();

    const handleItemClick = (notification) => {
        if (onNavigate) {
            onNavigate(notification);
        }
    };

    return (
        <div className="absolute right-[-10px] sm:right-auto sm:left-[-120px] top-[calc(100%+14px)] w-[300px] sm:w-[340px] max-h-[80vh] sm:max-h-[480px] flex flex-col bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] ring-1 ring-black/5 dark:ring-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100] origin-top-right sm:origin-top">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-surface)] shadow-sm z-10">
                <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-widest truncate">
                        Notifications
                    </span>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-extrabold shadow-sm shrink-0">
                            {unreadCount} new
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={onMarkAllRead}
                            className="text-[11px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer focus:outline-none"
                        >
                            Mark all as read
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close notifications panel"
                        className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-xl transition-all cursor-pointer flex items-center justify-center"
                        title="Close"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin relative bg-[var(--bg-main)]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-[var(--text-secondary)] font-semibold">Loading notifications...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4 space-y-2">
                        <svg className="w-8 h-8 text-[var(--color-danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm font-bold text-[var(--text-primary)]">Unable to load notifications</p>
                        <p className="text-xs text-[var(--text-secondary)]">Please check connection and try again.</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface-hover)] flex items-center justify-center text-[var(--text-secondary)] shadow-inner">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">No notifications yet</p>
                        <p className="text-xs text-[var(--text-secondary)] max-w-[200px] leading-relaxed">
                            When you receive friend requests, messages, or group updates, they’ll show up here.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col space-y-1.5 pb-1">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onDelete={deleteNotification}
                                onNavigate={() => handleItemClick(notification)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;