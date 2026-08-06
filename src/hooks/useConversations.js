// React
import { useState, useEffect } from 'react';

// Services & Hooks
import { conversationService } from '../services/conversationService';
import { useAuth } from './useAuth';
import { useToast } from '../context/ToastContext';

export const useConversations = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const startConversation = async (targetUser) => {
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
    };

    return {
        conversations,
        activeConversationId,
        setActiveConversationId,
        loading,
        startConversation,
    };
};

export default useConversations;