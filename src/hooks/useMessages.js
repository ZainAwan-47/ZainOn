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

    // EXACT FIX: Forwarding ALL 4 arguments (including clientMessageId).
    // This perfectly merges optimistic messages with real Firestore messages, 
    // permanently eliminating Grey Duplicates and unwanted drag-up scrolls.
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
                    clientMessageId
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