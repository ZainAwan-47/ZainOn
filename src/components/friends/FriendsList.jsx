// React
import React from 'react';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';

export const FriendsList = ({ friends = [], loading = false, onViewProfile }) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <div className="w-7 h-7 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-[var(--text-secondary)]">Loading friends...</p>
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 select-none">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] mb-1 shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">No Friends Yet</span>
                <p className="text-[11px] text-[var(--text-secondary)] leading-normal max-w-[200px]">
                    Search for users above to send friend requests.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-1.5 pt-0.5 select-none">
            <div className="px-1 py-1 flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                <span>My Friends</span>
                <span className="bg-[var(--bg-surface)] border border-[var(--border-color)] px-2 py-0.5 rounded-full text-[10px] text-[var(--color-primary)] font-bold">
                    {friends.length}
                </span>
            </div>

            {friends.map((friend) => (
                <div
                    key={friend.uid}
                    onClick={() => onViewProfile && onViewProfile(friend)}
                    className="p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-transparent hover:border-[var(--border-color)] transition-all cursor-pointer flex items-center justify-between group"
                >
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                        <Avatar
                            src={friend.photoURL}
                            name={friend.fullName}
                            size="md"
                            isOnline={friend.isOnline}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                                {friend.fullName}
                            </span>
                            <span className="text-[10px] font-medium text-[var(--text-secondary)] truncate">
                                @{friend.username}
                            </span>
                            <div className="mt-1">
                                <PresenceIndicator
                                    isOnline={friend.isOnline}
                                    lastSeen={friend.lastSeen}
                                    size="sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FriendsList;