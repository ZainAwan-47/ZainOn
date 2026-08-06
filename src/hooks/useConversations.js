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
                setConversations(data);
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