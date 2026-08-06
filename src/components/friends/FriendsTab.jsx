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
        // 1. Auto collapse mobile sidebar drawer
        if (isMobile && setIsSidebarOpen) {
            setIsSidebarOpen(false);
        }

        // 2. Dispatch profile view / chat launch
        if (onViewProfile) {
            onViewProfile(friend);
        } else if (onSelectFriend) {
            onSelectFriend(friend);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400 font-medium">Loading friends...</span>
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-2 select-none">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <span className="text-xs font-bold text-slate-300">No Friends Yet</span>
                <p className="text-[11px] text-slate-400 max-w-[200px]">
                    Search for users by username or name to add new friends.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-1.5 p-1">
            <div className="flex items-center justify-between px-2 py-1 mb-1 select-none">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    My Friends
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-bold">
                    {friends.length}
                </span>
            </div>

            {friends.map((friend) => (
                <div
                    key={friend.uid}
                    onClick={() => handleFriendClick(friend)}
                    className="p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/50 transition-all cursor-pointer flex items-center justify-between group select-none"
                >
                    <div className="flex items-center space-x-3.5 min-w-0">
                        <Avatar
                            src={friend.photoURL}
                            name={friend.fullName || 'User'}
                            size="md"
                            isOnline={friend.isOnline}
                        />

                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                                {friend.fullName || 'User'}
                            </span>
                            <span className="text-[10px] text-indigo-400 truncate">
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
                        className="p-2 text-slate-400 group-hover:text-indigo-400 hover:bg-slate-700/50 rounded-xl transition-all cursor-pointer shrink-0"
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