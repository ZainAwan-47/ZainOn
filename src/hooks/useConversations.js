// React
import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';

// Services & Hooks
import { conversationService } from '../services/conversationService';
import { useAuth } from './useAuth';
import { useToast } from '../context/ToastContext';

export const useConversations = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeConversationId, setActiveConversationId] = useState(null);

    // Sync activeConversationId to user's Firestore document for cross-client notification suppression
    useEffect(() => {
        if (!user?.uid) return;
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, {
            activeConversationId: activeConversationId || null
        }).catch(() => {
            setDoc(userRef, { activeConversationId: activeConversationId || null }, { merge: true }).catch(() => { });
        });
    }, [user?.uid, activeConversationId]);

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

    const closeActiveConversation = useCallback(() => {
        setActiveConversationId(null);
    }, []);

    return {
        conversations,
        activeConversationId,
        setActiveConversationId,
        closeActiveConversation,
        loading,
        startConversation,
    };
};

export default useConversations;