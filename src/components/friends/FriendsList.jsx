// React
import React from 'react';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';

export const FriendsList = ({ friends = [], loading = false, onViewProfile }) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <div className="w-7 h-7 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-400">Loading friends...</p>
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 select-none">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-center text-slate-400 mb-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <span className="text-xs font-bold text-slate-300">No Friends Yet</span>
                <p className="text-[11px] text-slate-400 leading-normal max-w-[200px]">
                    Search for users above to send friend requests.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-1.5 pt-0.5 select-none">
            <div className="px-1 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>My Friends</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[10px] text-indigo-400 font-bold">
                    {friends.length}
                </span>
            </div>

            {friends.map((friend) => (
                <div
                    key={friend.uid}
                    onClick={() => onViewProfile && onViewProfile(friend)}
                    className="p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/50 transition-all cursor-pointer flex items-center justify-between group"
                >
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                        <Avatar
                            src={friend.photoURL}
                            name={friend.fullName}
                            size="md"
                            isOnline={friend.isOnline}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                                {friend.fullName}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 truncate">
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