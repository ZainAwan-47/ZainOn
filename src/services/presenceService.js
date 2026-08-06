// Third Party Libraries
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Firebase
import { db } from '../firebase/firestore';

export const presenceService = {
    setOnline: async (uid) => {
        if (!uid) return;
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                isOnline: true,
                lastSeen: serverTimestamp(),
            });
        } catch (err) {
            console.error('[presenceService.setOnline]:', err);
        }
    },

    setOffline: async (uid) => {
        if (!uid) return;
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                isOnline: false,
                lastSeen: serverTimestamp(),
            });
        } catch (err) {
            console.error('[presenceService.setOffline]:', err);
        }
    },
};

export default presenceService;