// Third Party Libraries
import {
    collection,
    getDocs,
    query,
    limit,
    orderBy,
    doc,
    updateDoc,
} from 'firebase/firestore';

// Firebase
import { db } from '../firebase/firestore';

export const userService = {
    searchUsers: async (searchQuery, currentUserId) => {
        const trimmedQuery = searchQuery?.trim().toLowerCase();
        if (!trimmedQuery || !currentUserId) {
            return [];
        }

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('username'), limit(50));
            const querySnapshot = await getDocs(q);

            const matchedUsers = [];

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();

                if (data.uid === currentUserId) {
                    return;
                }

                // Honor target user's profileVisibility setting if available
                const visibility = data.privacy?.profileVisibility || 'everyone';
                if (visibility === 'nobody') {
                    return;
                }

                const usernameLower = (data.username || '').toLowerCase();
                const fullNameLower = (data.fullName || '').toLowerCase();

                if (
                    usernameLower.includes(trimmedQuery) ||
                    fullNameLower.includes(trimmedQuery)
                ) {
                    matchedUsers.push({
                        uid: data.uid,
                        fullName: data.fullName || 'User',
                        username: data.username || 'user',
                        photoURL: data.photoURL || '',
                        status: data.status || '',
                        isOnline: data.privacy?.onlineStatus === false ? false : Boolean(data.isOnline),
                        lastSeen: data.privacy?.lastSeen === 'nobody' ? null : (data.lastSeen || null),
                        bio: data.bio || '',
                        privacy: data.privacy || {},
                    });
                }
            });

            return matchedUsers.slice(0, 20);
        } catch (error) {
            console.error('[userService.searchUsers]: Error fetching users', error);
            throw new Error('Failed to search users. Please try again.');
        }
    },

    updateUserProfile: async (uid, profileData) => {
        if (!uid) throw new Error('User ID is required');
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                ...profileData,
                updatedAt: new Date().toISOString(),
            });
            return true;
        } catch (error) {
            console.error('[userService.updateUserProfile]: Error updating profile', error);
            throw new Error('Failed to update profile details.');
        }
    },

    updateUserSettings: async (uid, settings) => {
        if (!uid) throw new Error('User ID is required');
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                ...settings,
                updatedAt: new Date().toISOString(),
            });
            return true;
        } catch (error) {
            console.error('[userService.updateUserSettings]: Error updating settings', error);
            throw new Error('Failed to update settings. Please try again.');
        }
    },
};

export default userService;