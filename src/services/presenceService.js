// Third Party Libraries
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase
import { db } from '../firebase/firestore';

export const presenceService = {
    /**
     * Sets user status to online atomically.
     */
    setUserOnline: async (uid) => {
        if (!uid) return;
        try {
            const userRef = doc(db, 'users', uid);
            await setDoc(
                userRef,
                {
                    isOnline: true,
                    lastSeen: serverTimestamp(),
                },
                { merge: true }
            );
        } catch (error) {
            console.error('[presenceService.setUserOnline]:', error);
        }
    },

    /**
     * Sets user status to offline atomically.
     */
    setUserOffline: async (uid) => {
        if (!uid) return;
        try {
            const userRef = doc(db, 'users', uid);
            await setDoc(
                userRef,
                {
                    isOnline: false,
                    lastSeen: serverTimestamp(),
                },
                { merge: true }
            );
        } catch (error) {
            console.error('[presenceService.setUserOffline]:', error);
        }
    },
};

export default presenceService;