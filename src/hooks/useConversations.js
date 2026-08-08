// React
import { useState, useEffect, useCallback } from 'react';

// Services & Hooks
import { conversationService } from '../services/conversationService';
import { useAuth } from './useAuth';
import { useToast } from '../context/ToastContext';

const ACTIVE_CONV_STORAGE_KEY = 'zainon_active_conversation_id';

export const useConversations = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initialize active conversation ID from localStorage
    const [activeConversationId, setActiveConversationIdState] = useState(() => {
        return localStorage.getItem(ACTIVE_CONV_STORAGE_KEY) || null;
    });

    const setActiveConversationId = useCallback((id) => {
        setActiveConversationIdState(id);
        if (id) {
            localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, id);
        } else {
            localStorage.removeItem(ACTIVE_CONV_STORAGE_KEY);
        }
    }, []);

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
                // FIX: Intercept data and enforce strict local sorting.
                // Firebase optimistic updates return null for serverTimestamp() initially.
                // We treat null as Date.now() so the chat stays pinned to the top instantly.
                const sortedData = [...data].sort((a, b) => {
                    const getMillis = (ts) => {
                        if (!ts) return Date.now(); // Pending optimistic update = happens right now
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
        [user, setActiveConversationId, showToast]
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