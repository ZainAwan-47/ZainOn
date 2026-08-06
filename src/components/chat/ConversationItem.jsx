// React
import React, { memo } from 'react';

// Hooks & Components
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';

export const ConversationItem = memo(({
    conversation,
    isActive = false,
    onClick,
}) => {
    const { user } = useAuth();
    const otherUser = conversation.otherParticipant || {};
    const lastMessage = conversation.lastMessage;
    const unreadCount = conversation.unreadCount || 0;

    const isOwnLastMessage = Boolean(
        lastMessage?.senderId && user?.uid && lastMessage.senderId === user.uid
    );

    const rawTimestamp = conversation.lastActivity || conversation.createdAt;
    let formattedTime = '';
    if (rawTimestamp?.toDate) {
        const date = rawTimestamp.toDate();
        const now = new Date();
        if (now.toDateString() === date.toDateString()) {
            formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } else {
            formattedTime = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    return (
        <div
            onClick={onClick}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3.5 group select-none ${isActive
                    ? 'bg-slate-800/90 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-slate-800/40 hover:bg-slate-800/80 border-transparent hover:border-slate-700/50'
                }`}
        >
            <Avatar
                src={otherUser.photoURL}
                name={otherUser.fullName || 'User'}
                size="md"
                isOnline={otherUser.isOnline}
            />

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span
                        className={`text-xs font-bold truncate transition-colors ${isActive ? 'text-indigo-300' : 'text-white group-hover:text-indigo-300'
                            }`}
                    >
                        {otherUser.fullName || 'Direct Message'}
                    </span>
                    {formattedTime && (
                        <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-2">
                            {formattedTime}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 truncate pr-2">
                        {lastMessage?.text ? (
                            <>
                                {isOwnLastMessage && (
                                    <span className="font-bold text-indigo-400 mr-1">You:</span>
                                )}
                                <span>{lastMessage.text}</span>
                            </>
                        ) : (
                            <span className="italic text-slate-500">No messages yet</span>
                        )}
                    </p>

                    {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-[10px] text-white font-extrabold shrink-0 shadow-sm animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
});

ConversationItem.displayName = 'ConversationItem';
export default ConversationItem;