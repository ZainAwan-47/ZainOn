// React
import React from 'react';
import { useOutletContext } from 'react-router-dom';

// Components
import ChatRoom from '../components/chat/ChatRoom';

export const ChatPage = () => {
    const {
        conversations = [],
        activeConversationId,
        setActiveConversationId,
        setSelectedPreviewUser,
    } = useOutletContext();

    // Match by id OR groupId to guarantee active group resolution
    const activeConversation = conversations.find(
        (c) =>
            c.id === activeConversationId ||
            c.groupId === activeConversationId
    );

    if (!activeConversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full p-6 text-center select-none bg-slate-950">
                <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-xl">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">Your Workspace Chat</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                    Select an active conversation from the sidebar or pick a user to start chatting in real time.
                </p>
            </div>
        );
    }

    return (
        <ChatRoom
            conversation={activeConversation}
            onViewProfile={setSelectedPreviewUser}
            // --- FIX: Pass down onCloseChat to make the cross button render ---
            onCloseChat={() => setActiveConversationId(null)}
        />
    );
};

export default ChatPage;