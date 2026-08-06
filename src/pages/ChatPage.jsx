// React
import React, { useMemo, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

// Components
import ChatRoom from '../components/chat/ChatRoom';
import ProfilePreviewModal from '../components/friends/ProfilePreviewModal';

export const ChatPage = () => {
    const { conversations, activeConversationId, setActiveConversationId } = useOutletContext();
    const [selectedPreviewUser, setSelectedPreviewUser] = useState(null);

    const activeConversation = useMemo(
        () => conversations?.find((c) => c.id === activeConversationId),
        [conversations, activeConversationId]
    );

    const handleCloseChat = useCallback(() => {
        if (setActiveConversationId) {
            setActiveConversationId(null);
        }
    }, [setActiveConversationId]);

    return (
        <div className="flex-1 flex h-full min-h-0 relative">
            {selectedPreviewUser && (
                <ProfilePreviewModal
                    targetUser={selectedPreviewUser}
                    onClose={() => setSelectedPreviewUser(null)}
                />
            )}

            {activeConversation ? (
                <ChatRoom
                    conversation={activeConversation}
                    onViewProfile={(targetUser) => setSelectedPreviewUser(targetUser)}
                    onCloseChat={handleCloseChat}
                />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 select-none animate-auth-card">
                    <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-500 mb-4 shadow-xl">
                        <svg className="w-8 h-8 text-indigo-500/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h2 className="text-base font-bold text-white tracking-tight">Your Workspace Chat</h2>
                    <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                        Select an active conversation from the sidebar or pick a friend to start chatting in real time.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ChatPage;