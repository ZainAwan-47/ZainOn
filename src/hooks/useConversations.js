// React
import { useState, useEffect, useCallback } from 'react';

// Services & Hooks
import { conversationService } from '../services/conversationService';
import { useAuth } from './useAuth';
import { useToast } from '../context/ToastContext';

export const useConversations = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    // EXACT FIX 1: Removed localStorage completely.
    // Now on every refresh, the active chat is null by default, showing the clean placeholder screen.
    const [activeConversationId, setActiveConversationId] = useState(null);

    useEffect(() => {
        if (!user?.uid) {
            setConversations([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsub = conversationService.subscribeToUserConversations(
            user.uid,
            (data) => {
                const sortedData = [...data].sort((a, b) => {
                    const getMillis = (ts) => {
                        if (!ts) return Date.now();
                        if (typeof ts.toMillis === 'function') return ts.toMillis();
                        if (ts instanceof Date) return ts.getTime();
                        return 0;
                    };
                    return getMillis(b.lastActivity) - getMillis(a.lastActivity);
                });

                setConversations(sortedData);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [user?.uid]);

    const startConversation = useCallback(
        async (targetUser) => {
            if (!user || !targetUser) return null;
            try {
                const convId = await conversationService.getOrCreateDirectConversation(
                    user,
                    targetUser
                );
                setActiveConversationId(convId);
                return convId;
            } catch (error) {
                showToast(error.message || 'Failed to start conversation.', 'error');
                return null;
            }
        },
        [user, showToast]
    );

    return {
        conversations,
        activeConversationId,
        setActiveConversationId,
        loading,
        startConversation,
    };
};

export default useConversations;