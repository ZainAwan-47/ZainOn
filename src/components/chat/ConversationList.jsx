// React
import React from 'react';

// Components
import ConversationItem from './ConversationItem';

export const ConversationList = ({
    conversations = [],
    loading = false,
    activeConversationId,
    onSelectConversation,
}) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <div className="w-7 h-7 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-400">Loading conversations...</p>
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 select-none">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-center text-slate-400 mb-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <span className="text-xs font-bold text-slate-300">No Conversations Yet</span>
                <p className="text-[11px] text-slate-400 leading-normal max-w-[200px]">
                    Select a friend in the Friends tab to start chatting!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-1.5 pt-0.5 select-none">
            <div className="px-1 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Recent Chats</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[10px] text-indigo-400 font-bold">
                    {conversations.length}
                </span>
            </div>

            {conversations.map((conv) => (
                <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeConversationId}
                    onClick={() => onSelectConversation && onSelectConversation(conv)}
                />
            ))}
        </div>
    );
};

export default ConversationList;