// React
import { useState, useEffect, useCallback } from 'react';

// Hooks & Services
import { useAuth } from './useAuth';
import { messageService } from '../services/messageService';

export const useMessages = (conversationId, recipientUid) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!conversationId || !user?.uid) {
            setMessages([]);
            setLoading(false);
            return () => { };
        }

        setLoading(true);

        const unsubscribe = messageService.subscribeToMessages(
            conversationId,
            user.uid,
            50,
            (fetchedMessages) => {
                setMessages(fetchedMessages);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [conversationId, user?.uid]);

    // Forwarding conversationId as activeConversationId to prevent notifications when the chat is open
    const sendMessage = useCallback(
        async (text, replyTo = null, isFriend = true, clientMessageId = null) => {
            if (!conversationId || !user?.uid || !text.trim()) return;
            try {
                await messageService.sendMessage(
                    conversationId,
                    user.uid,
                    text,
                    recipientUid,
                    replyTo,
                    isFriend,
                    clientMessageId,
                    {},
                    conversationId // Pass activeConversationId here to suppress notifications for active chat
                );
            } catch (error) {
                console.error('[useMessages.sendMessage]:', error);
            }
        },
        [conversationId, user?.uid, recipientUid]
    );

    return {
        messages,
        loading,
        sendMessage,
    };
};

export default useMessages;