// Third Party Libraries
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    writeBatch,
    getDocs,
} from 'firebase/firestore';

// Firebase
import { db } from '../firebase/firestore';

export const notificationService = {
    /**
     * Creates a new notification for a specific recipient user.
     */
    createNotification: async (recipientId, payload) => {
        if (!recipientId || !payload || !payload.type) return;

        // Never create a notification for the actor themselves
        if (payload.actorId && recipientId === payload.actorId) return;

        try {
            let notifRef;
            const isMessage = payload.type === 'direct_message' || payload.type === 'group_message';

            if (isMessage) {
                // Unique document ID for each chat message notification to allow multiple unread messages
                notifRef = doc(collection(db, 'users', recipientId, 'notifications'));
            } else {
                // Deterministic ID for state/action events to prevent duplicate pending notifications
                const deterministicKey = `${payload.type}_${payload.actorId || 'system'}_${payload.targetId || 'general'}`;
                notifRef = doc(db, 'users', recipientId, 'notifications', deterministicKey);
            }

            const notificationData = {
                id: notifRef.id,
                type: payload.type,
                title: payload.title || 'Notification',
                body: payload.body || '',
                actorId: payload.actorId || '',
                actorName: payload.actorName || '',
                actorPhotoURL: payload.actorPhotoURL || '',
                targetId: payload.targetId || '',
                targetType: payload.targetType || '',
                read: false,
                createdAt: serverTimestamp(),
            };

            await setDoc(notifRef, notificationData, { merge: true });
        } catch (error) {
            console.error('[notificationService.createNotification]:', error);
            throw error;
        }
    },

    /**
     * Realtime listener for a user's notifications, ordered newest first.
     */
    subscribeToNotifications: (currentUid, callback, limitCount = 30) => {
        if (!currentUid) return () => { };

        const notifsRef = collection(db, 'users', currentUid, 'notifications');
        const q = query(notifsRef, orderBy('createdAt', 'desc'), limit(limitCount));

        return onSnapshot(
            q,
            (snapshot) => {
                const notifications = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                    createdAt: docSnap.data().createdAt || new Date(),
                }));
                callback(notifications);
            },
            (error) => {
                console.error('[notificationService.subscribeToNotifications]:', error);
                callback([]);
            }
        );
    },

    /**
     * Marks an individual notification as read.
     */
    markNotificationAsRead: async (currentUid, notificationId) => {
        if (!currentUid || !notificationId) return;
        try {
            const notifRef = doc(db, 'users', currentUid, 'notifications', notificationId);
            await updateDoc(notifRef, { read: true });
        } catch (error) {
            console.error('[notificationService.markNotificationAsRead]:', error);
            throw error;
        }
    },

    /**
     * Marks all unread notifications as read for the current user.
     */
    markAllNotificationsAsRead: async (currentUid) => {
        if (!currentUid) return;
        try {
            const notifsRef = collection(db, 'users', currentUid, 'notifications');
            const snapshot = await getDocs(notifsRef);
            if (snapshot.empty) return;

            const batch = writeBatch(db);
            let updateCount = 0;
            snapshot.docs.forEach((docSnap) => {
                if (!docSnap.data().read) {
                    batch.update(docSnap.ref, { read: true });
                    updateCount++;
                }
            });
            if (updateCount > 0) {
                await batch.commit();
            }
        } catch (error) {
            console.error('[notificationService.markAllAsRead]:', error);
            throw error;
        }
    },

    /**
     * Deletes a single notification by ID.
     */
    deleteNotification: async (currentUid, notificationId) => {
        if (!currentUid || !notificationId) return;
        try {
            const notifRef = doc(db, 'users', currentUid, 'notifications', notificationId);
            await deleteDoc(notifRef);
        } catch (error) {
            console.error('[notificationService.deleteNotification]:', error);
            throw error;
        }
    },

    /**
     * Deletes all notifications for the current user.
     */
    deleteAllNotifications: async (currentUid) => {
        if (!currentUid) return;
        try {
            const notifsRef = collection(db, 'users', currentUid, 'notifications');
            const snapshot = await getDocs(notifsRef);
            if (snapshot.empty) return;

            const batch = writeBatch(db);
            snapshot.docs.forEach((docSnap) => {
                batch.delete(docSnap.ref);
            });
            await batch.commit();
        } catch (error) {
            console.error('[notificationService.deleteAllNotifications]:', error);
            throw error;
        }
    },
};

export default notificationService;