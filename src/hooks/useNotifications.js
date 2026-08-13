import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './useAuth';
import { notificationService } from '../services/notificationService';

export const useNotifications = (activeConversationId = null) => {
    const { user } = useAuth();
    const currentUid = user?.uid;

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const activeChatRef = useRef(activeConversationId);
    useEffect(() => {
        activeChatRef.current = activeConversationId;
    }, [activeConversationId]);

    // Subscription Effect: Listens for incoming notifications and filters out active open chats in-memory
    useEffect(() => {
        if (!currentUid) {
            setNotifications([]);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        const unsubscribe = notificationService.subscribeToNotifications(
            currentUid,
            (data) => {
                const filtered = data.filter((n) => {
                    const isChatMsg = n.type === 'direct_message' || n.type === 'group_message';
                    if (isChatMsg && n.targetId === activeChatRef.current) {
                        return false;
                    }
                    return true;
                });
                setNotifications(filtered);
                setLoading(false);
            },
            30
        );

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [currentUid]);

    // Sweeper Effect: Permanently deletes existing chat notifications when that conversation is opened
    useEffect(() => {
        if (!activeConversationId || !currentUid || notifications.length === 0) return;

        const toClear = notifications.filter(n =>
            (n.type === 'direct_message' || n.type === 'group_message') &&
            n.targetId === activeConversationId
        );

        if (toClear.length > 0) {
            toClear.forEach(n => {
                notificationService.deleteNotification(currentUid, n.id).catch(() => { });
            });
        }
    }, [activeConversationId, currentUid, notifications]);

    const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

    const markAsRead = useCallback(async (notificationId) => {
        if (!currentUid || !notificationId) return;
        try {
            await notificationService.markNotificationAsRead(currentUid, notificationId);
        } catch (err) {
            console.error('[useNotifications.markAsRead]:', err);
        }
    }, [currentUid]);

    const markAllAsRead = useCallback(async () => {
        if (!currentUid) return;
        try {
            await notificationService.markAllNotificationsAsRead(currentUid);
        } catch (err) {
            console.error('[useNotifications.markAllAsRead]:', err);
        }
    }, [currentUid]);

    const deleteNotification = useCallback(async (notificationId) => {
        if (!currentUid || !notificationId) return;
        try {
            await notificationService.deleteNotification(currentUid, notificationId);
        } catch (err) {
            console.error('[useNotifications.deleteNotification]:', err);
        }
    }, [currentUid]);

    const deleteAllNotifications = useCallback(async () => {
        if (!currentUid) return;
        try {
            await notificationService.deleteAllNotifications(currentUid);
        } catch (err) {
            console.error('[useNotifications.deleteAllNotifications]:', err);
        }
    }, [currentUid]);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
    };
};

export default useNotifications;