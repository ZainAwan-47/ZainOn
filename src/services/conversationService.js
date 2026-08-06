// Third Party Libraries
import {
    collection,
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    serverTimestamp,
    query,
    where,
} from 'firebase/firestore';

// Firebase
import { db } from '../firebase/firestore';

export const conversationService = {
    getDirectConversationId: (uid1, uid2) => {
        if (!uid1 || !uid2) return '';
        return [uid1, uid2].sort().join('_');
    },

    getOrCreateDirectConversation: async (currentUser, targetUser) => {
        if (!currentUser?.uid || !targetUser?.uid) {
            throw new Error('Invalid participants for conversation creation.');
        }

        const conversationId = conversationService.getDirectConversationId(
            currentUser.uid,
            targetUser.uid
        );

        try {
            const convRef = doc(db, 'conversations', conversationId);
            const convSnap = await getDoc(convRef);

            if (!convSnap.exists()) {
                const participantIds = [currentUser.uid, targetUser.uid].sort();

                await setDoc(convRef, {
                    id: conversationId,
                    type: 'direct',
                    participantIds,
                    participants: {
                        [currentUser.uid]: {
                            uid: currentUser.uid,
                            fullName: currentUser.fullName || currentUser.displayName || 'User',
                            username: currentUser.username || 'user',
                            photoURL: currentUser.photoURL || '',
                        },
                        [targetUser.uid]: {
                            uid: targetUser.uid,
                            fullName: targetUser.fullName || targetUser.displayName || 'User',
                            username: targetUser.username || 'user',
                            photoURL: targetUser.photoURL || '',
                        },
                    },
                    lastMessage: null,
                    lastActivity: serverTimestamp(),
                    unreadCounts: {
                        [currentUser.uid]: 0,
                        [targetUser.uid]: 0,
                    },
                    isArchived: {
                        [currentUser.uid]: false,
                        [targetUser.uid]: false,
                    },
                    isMuted: {
                        [currentUser.uid]: false,
                        [targetUser.uid]: false,
                    },
                    isBlocked: {
                        [currentUser.uid]: false,
                        [targetUser.uid]: false,
                    },
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }

            return conversationId;
        } catch (error) {
            console.error('[conversationService.getOrCreateDirectConversation]:', error);
            throw error;
        }
    },

    /**
     * Real-time conversation subscriber with persistent presence profile caching.
     * Guarantees isOnline and read receipt dot states persist across message snapshot writes.
     */
    subscribeToUserConversations: (currentUid, callback) => {
        if (!currentUid) return () => { };

        const q = query(
            collection(db, 'conversations'),
            where('participantIds', 'array-contains', currentUid)
        );

        const activeProfileListeners = new Map();
        const cachedUserProfiles = new Map();

        const unsubQuery = onSnapshot(
            q,
            (snapshot) => {
                if (snapshot.empty) {
                    activeProfileListeners.forEach((unsub) => unsub());
                    activeProfileListeners.clear();
                    cachedUserProfiles.clear();
                    callback([]);
                    return;
                }

                const rawConversations = snapshot.docs.map((docSnap) => docSnap.data());
                const hydratedConversationsMap = new Map();

                const buildHydratedConversation = (conv) => {
                    const otherUid = conv.participantIds?.find((id) => id !== currentUid);
                    const staticOtherProfile = conv.participants?.[otherUid] || null;
                    const liveProfile = cachedUserProfiles.get(otherUid);

                    const otherParticipant = staticOtherProfile
                        ? {
                            uid: staticOtherProfile.uid,
                            fullName: liveProfile?.fullName || staticOtherProfile.fullName || 'User',
                            username: liveProfile?.username || staticOtherProfile.username || 'user',
                            photoURL: liveProfile?.photoURL || staticOtherProfile.photoURL || '',
                            isOnline: liveProfile !== undefined ? Boolean(liveProfile.isOnline) : Boolean(staticOtherProfile.isOnline),
                            lastSeen: liveProfile?.lastSeen || staticOtherProfile.lastSeen || null,
                        }
                        : null;

                    return {
                        ...conv,
                        otherParticipant,
                        unreadCount: conv.unreadCounts?.[currentUid] || 0,
                    };
                };

                const sortAndDeliver = () => {
                    const sortedList = Array.from(hydratedConversationsMap.values()).sort(
                        (a, b) => {
                            const timeA = a.lastActivity?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
                            const timeB = b.lastActivity?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
                            return timeB - timeA;
                        }
                    );
                    callback(sortedList);
                };

                // 1. Populate map using persistent profile cache
                rawConversations.forEach((conv) => {
                    hydratedConversationsMap.set(conv.id, buildHydratedConversation(conv));
                });

                sortAndDeliver();

                // 2. Attach live user presence listeners
                rawConversations.forEach((conv) => {
                    const otherUid = conv.participantIds?.find((id) => id !== currentUid);
                    if (otherUid && !activeProfileListeners.has(otherUid)) {
                        const otherUserRef = doc(db, 'users', otherUid);
                        const unsubProfile = onSnapshot(
                            otherUserRef,
                            (userSnap) => {
                                if (userSnap.exists()) {
                                    const liveUserData = userSnap.data();
                                    const updatedProfile = {
                                        uid: liveUserData.uid,
                                        fullName: liveUserData.fullName || 'User',
                                        username: liveUserData.username || 'user',
                                        photoURL: liveUserData.photoURL || '',
                                        isOnline: Boolean(liveUserData.isOnline),
                                        lastSeen: liveUserData.lastSeen || null,
                                    };

                                    cachedUserProfiles.set(otherUid, updatedProfile);

                                    // Update all conversations containing this participant
                                    hydratedConversationsMap.forEach((storedConv, cId) => {
                                        if (storedConv.participantIds?.includes(otherUid)) {
                                            hydratedConversationsMap.set(cId, buildHydratedConversation(storedConv));
                                        }
                                    });

                                    sortAndDeliver();
                                }
                            },
                            (err) => console.error('[subscribeToUserConversations.profile]:', err)
                        );

                        activeProfileListeners.set(otherUid, unsubProfile);
                    }
                });
            },
            (error) => {
                console.error('[conversationService.subscribeToUserConversations]:', error);
                callback([]);
            }
        );

        return () => {
            unsubQuery();
            activeProfileListeners.forEach((unsub) => unsub());
            activeProfileListeners.clear();
            cachedUserProfiles.clear();
        };
    },
};

export default conversationService;