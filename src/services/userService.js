// Third Party Libraries
import {
    collection,
    getDocs,
    query,
    limit,
    orderBy,
} from 'firebase/firestore';

// Firebase
import { db } from '../firebase/firestore';

export const userService = {
    /**
     * Searches for registered users by matching username or fullName.
     * Excludes the current authenticated user and caps results at 20 items.
     * @param {string} searchQuery - Search term input.
     * @param {string} currentUserId - Authenticated user ID to exclude.
     * @returns {Promise<Array<Object>>} List of matched user profiles.
     */
    searchUsers: async (searchQuery, currentUserId) => {
        const trimmedQuery = searchQuery?.trim().toLowerCase();
        if (!trimmedQuery || !currentUserId) {
            return [];
        }

        try {
            const usersRef = collection(db, 'users');
            // Fetch Candidate Batch ordered by username
            const q = query(usersRef, orderBy('username'), limit(50));
            const querySnapshot = await getDocs(q);

            const matchedUsers = [];

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();

                // Exclude current authenticated user
                if (data.uid === currentUserId) {
                    return;
                }

                const usernameLower = (data.username || '').toLowerCase();
                const fullNameLower = (data.fullName || '').toLowerCase();

                // Perform prefix & substring matching
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
                        isOnline: Boolean(data.isOnline),
                        lastSeen: data.lastSeen || null,
                    });
                }
            });

            // Return max 20 matched results
            return matchedUsers.slice(0, 20);
        } catch (error) {
            console.error('[userService.searchUsers]: Error fetching users', error);
            throw new Error('Failed to search users. Please try again.');
        }
    },
};

export default userService;