// React
import React, { memo } from 'react';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';

export const FriendsTab = memo(({
    friends = [],
    loading = false,
    onSelectFriend,
    onViewProfile,
    isMobile = false,
    setIsSidebarOpen,
}) => {
    const handleFriendClick = (friend) => {
        if (isMobile && setIsSidebarOpen) {
            setIsSidebarOpen(false);
        }

        if (onViewProfile) {
            onViewProfile(friend);
        } else if (onSelectFriend) {
            onSelectFriend(friend);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[var(--text-secondary)] font-medium">Loading friends...</span>
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-2 select-none">
                <div className="w-10 h-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] mb-1 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">No Friends Yet</span>
                <p className="text-[11px] text-[var(--text-secondary)] max-w-[200px]">
                    Search for users by username or name to add new friends.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-1.5 p-1">
            <div className="flex items-center justify-between px-2 py-1 mb-1 select-none">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    My Friends
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[10px] text-[var(--text-secondary)] font-bold">
                    {friends.length}
                </span>
            </div>

            {friends.map((friend) => (
                <div
                    key={friend.uid}
                    onClick={() => handleFriendClick(friend)}
                    className="p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-transparent hover:border-[var(--border-color)] transition-all cursor-pointer flex items-center justify-between group select-none shadow-sm"
                >
                    <div className="flex items-center space-x-3.5 min-w-0">
                        <Avatar
                            src={friend.photoURL}
                            name={friend.fullName || 'User'}
                            size="md"
                            isOnline={friend.isOnline}
                        />

                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                                {friend.fullName || 'User'}
                            </span>
                            <span className="text-[10px] text-[var(--color-primary)] opacity-90 truncate">
                                @{friend.username || 'username'}
                            </span>
                            <div className="mt-0.5">
                                <PresenceIndicator
                                    isOnline={friend.isOnline}
                                    lastSeen={friend.lastSeen}
                                    size="sm"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="p-2 text-[var(--text-secondary)] group-hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface-hover)] rounded-xl transition-all cursor-pointer shrink-0"
                        title="View Profile"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
});

FriendsTab.displayName = 'FriendsTab';
export default FriendsTab;