// React
import React, { memo } from 'react';

// Third Party
import { motion, AnimatePresence } from 'framer-motion';

// Components
import ConversationItem from './ConversationItem';

export const ConversationList = memo(({
    conversations = [],
    loading = false,
    activeConversationId = null,
    onSelectConversation,
    onDeleteConversation,
}) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[var(--text-secondary)] font-medium">Loading chats...</span>
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-2 select-none">
                <div className="w-10 h-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] mb-1 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">No Conversations Yet</span>
                <p className="text-[11px] text-[var(--text-secondary)] max-w-[200px]">
                    Select a friend in the Friends tab to start chatting!
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-1.5 p-1 relative">
            <div className="flex items-center justify-between px-2 py-1 mb-1 select-none">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] opacity-80 uppercase tracking-wider">
                    Recent Chats
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-[var(--bg-surface-hover)] text-[10px] text-[var(--text-secondary)] font-bold">
                    {conversations.length}
                </span>
            </div>

            <AnimatePresence initial={false}>
                {conversations.map((conv) => (
                    <motion.div
                        key={conv.id}
                        layout // This single prop creates the buttery smooth vertical glide
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                        <ConversationItem
                            conversation={conv}
                            isActive={conv.id === activeConversationId}
                            onClick={() => onSelectConversation && onSelectConversation(conv)}
                            onDeleted={(deletedId) => {
                                if (onDeleteConversation) {
                                    onDeleteConversation(deletedId);
                                }
                            }}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
});

ConversationList.displayName = 'ConversationList';
export default ConversationList;