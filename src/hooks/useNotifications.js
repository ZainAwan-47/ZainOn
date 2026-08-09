// React
import { useState, useEffect, useCallback, useMemo } from 'react';

// Hooks & Services
import { useAuth } from './useAuth';
import { notificationService } from '../services/notificationService';

export const useNotifications = () => {
    const { user } = useAuth();
    const currentUid = user?.uid;

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Realtime subscription lifecycle & authentication changes
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
                setNotifications(data);
                setLoading(false);
            },
            30
        );

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [currentUid]);

    // Unread count calculated efficiently from realtime state
    const unreadCount = useMemo(() => {
        return notifications.filter((n) => !n.read).length;
    }, [notifications]);

    // Action wrappers with error handling
    const markAsRead = useCallback(async (notificationId) => {
        if (!currentUid || !notificationId) return;
        try {
            setError(null);
            await notificationService.markNotificationAsRead(currentUid, notificationId);
        } catch (err) {
            console.error('[useNotifications.markAsRead]:', err);
            setError(err.message || 'Failed to mark notification as read.');
        }
    }, [currentUid]);

    const markAllAsRead = useCallback(async () => {
        if (!currentUid) return;
        try {
            setError(null);
            await notificationService.markAllNotificationsAsRead(currentUid);
        } catch (err) {
            console.error('[useNotifications.markAllAsRead]:', err);
            setError(err.message || 'Failed to mark all notifications as read.');
        }
    }, [currentUid]);

    const deleteNotification = useCallback(async (notificationId) => {
        if (!currentUid || !notificationId) return;
        try {
            setError(null);
            await notificationService.deleteNotification(currentUid, notificationId);
        } catch (err) {
            console.error('[useNotifications.deleteNotification]:', err);
            setError(err.message || 'Failed to delete notification.');
        }
    }, [currentUid]);

    const deleteAllNotifications = useCallback(async () => {
        if (!currentUid) return;
        try {
            setError(null);
            await notificationService.deleteAllNotifications(currentUid);
        } catch (err) {
            console.error('[useNotifications.deleteAllNotifications]:', err);
            setError(err.message || 'Failed to delete all notifications.');
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