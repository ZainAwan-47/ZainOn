// React
import { useState, useEffect, useCallback } from 'react';

// Services & Context
import { messageService } from '../services/messageService';
import { useAuth } from './useAuth';
import { useToast } from '../context/ToastContext';

export const useMessages = (conversationId, recipientId) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsub = messageService.subscribeToMessages(conversationId, 50, (realtimeData) => {
            setMessages(realtimeData);
            setLoading(false);
        });

        return () => unsub();
    }, [conversationId]);

    const sendMessage = useCallback(
        async (text, replyTo = null) => {
            const trimmedText = text?.trim();
            if (!conversationId || !user?.uid || !trimmedText) return;

            try {
                await messageService.sendMessage(
                    conversationId,
                    user.uid,
                    trimmedText,
                    recipientId,
                    replyTo
                );
            } catch (error) {
                showToast('Failed to send message. Please try again.', 'error');
                console.error('[useMessages.sendMessage]:', error);
            }
        },
        [conversationId, user?.uid, recipientId, showToast]
    );

    return {
        messages,
        loading,
        sendMessage,
    };
};

export default useMessages;