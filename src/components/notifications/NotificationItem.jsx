// React
import React from 'react';

// Components
import Avatar from '../ui/Avatar';

// Helper for relative time formatting
const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    let date = timestamp;
    if (typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else if (!(timestamp instanceof Date)) {
        date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const NotificationItem = ({ notification, onDelete, onNavigate }) => {
    if (!notification) return null;

    const { id, type, title, body, actorName, actorPhotoURL, read, createdAt } = notification;

    const handleClick = () => {
        if (onNavigate) {
            onNavigate(notification);
        }
    };

    const handleDeleteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDelete) {
            onDelete(id);
        }
    };

    // Type indicator overlay icon treatment
    const renderTypeBadge = () => {
        switch (type) {
            case 'friend_request':
            case 'friend_accepted':
                return (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center text-[9px] shadow-sm ring-2 ring-[var(--bg-surface)]">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                );
            case 'group_added':
            case 'group_removed':
            case 'group_role_update':
            case 'group_ownership_transfer':
                return (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center text-[10px] shadow-sm font-black ring-2 ring-[var(--bg-surface)]">
                        #
                    </div>
                );
            case 'direct_message':
            case 'group_message':
            default:
                return (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center text-[9px] shadow-sm ring-2 ring-[var(--bg-surface)]">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            aria-label={`${title}: ${body}`}
            className={`group relative p-3 pr-10 rounded-xl border transition-all duration-150 ease-out cursor-pointer flex items-start space-x-3.5 select-none outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 animate-in fade-in slide-in-from-bottom-2 ${!read
                ? 'bg-[var(--bg-surface)] border-[var(--color-primary)]/30 shadow-[0_2px_8px_rgba(0,0,0,0.1)] ring-1 ring-[var(--color-primary)]/10 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:border-[var(--color-primary)]/50'
                : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border-transparent hover:border-[var(--border-color)]'
                }`}
        >
            {/* Avatar & Type Badge */}
            <div className="relative shrink-0 mt-0.5">
                <Avatar src={actorPhotoURL} name={actorName || 'User'} size="md" />
                {renderTypeBadge()}
            </div>

            {/* Notification Text Content */}
            <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between mb-1">
                    <span className={`text-[13px] truncate ${!read ? 'font-bold text-[var(--text-primary)]' : 'font-semibold text-[var(--text-primary)]'}`}>
                        {title}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] shrink-0 ml-2">
                        {formatRelativeTime(createdAt)}
                    </span>
                </div>
                <p className={`text-xs line-clamp-2 leading-relaxed transition-colors duration-150 ${!read ? 'text-[var(--text-primary)] opacity-90 font-medium' : 'text-[var(--text-secondary)]'}`}>
                    {body}
                </p>
            </div>

            {/* Subtle X to clear notification */}
            <div className="absolute right-2 top-2 flex items-center space-x-2">
                {!read && (
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 shadow-sm" aria-hidden="true" />
                )}
                {onDelete && (
                    <button
                        type="button"
                        onClick={handleDeleteClick}
                        aria-label="Remove notification"
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-[var(--text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-all duration-150 ease-out cursor-pointer shrink-0 active:scale-90"
                        title="Dismiss"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default NotificationItem;