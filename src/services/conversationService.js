// Third Party Libraries
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    onSnapshot,
    serverTimestamp,
    query,
    where,
    writeBatch,
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
                    createdBy: currentUser.uid,
                    participantIds,
                    members: participantIds,
                    hiddenFor: [],
                    clearedAt: {},
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
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            } else {
                const data = convSnap.data();
                const updates = {};

                if (data.hiddenFor?.includes(currentUser.uid)) {
                    updates.hiddenFor = arrayRemove(currentUser.uid);
                }

                if (Object.keys(updates).length > 0) {
                    await updateDoc(convRef, updates);
                }
            }

            return conversationId;
        } catch (error) {
            console.error('[conversationService.getOrCreateDirectConversation]:', error);
            throw error;
        }
    },

    // Fixed using setDoc with merge: true so it auto-initializes the typing map safely
    setTypingStatus: async (conversationId, userId, isTyping) => {
        if (!conversationId || !userId) return;
        try {
            const convRef = doc(db, 'conversations', conversationId);
            await setDoc(
                convRef,
                {
                    typing: {
                        [userId]: isTyping,
                    },
                },
                { merge: true }
            );
        } catch (error) {
            console.error('[conversationService.setTypingStatus]:', error);
        }
    },

    subscribeToUserConversations: (currentUid, callback) => {
        if (!currentUid) return () => { };

        const q = query(
            collection(db, 'conversations'),
            where('participantIds', 'array-contains', currentUid)
        );

        const activeProfileListeners = new Map();
        const cachedUserProfiles = new Map();
        const rawConversationsMap = new Map();

        const unsubQuery = onSnapshot(
            q,
            (snapshot) => {
                if (snapshot.empty) {
                    activeProfileListeners.forEach((unsub) => unsub());
                    activeProfileListeners.clear();
                    cachedUserProfiles.clear();
                    rawConversationsMap.clear();
                    callback([]);
                    return;
                }

                rawConversationsMap.clear();
                snapshot.docs.forEach((docSnap) => {
                    rawConversationsMap.set(docSnap.id, {
                        id: docSnap.id,
                        ...docSnap.data(),
                    });
                });

                const buildHydratedConversation = (rawConv) => {
                    const isGroup = rawConv.type === 'group';
                    const userClearedAt = rawConv.clearedAt?.[currentUid]?.toMillis?.() || 0;
                    const lastMsgTime = rawConv.lastMessage?.createdAt?.toMillis?.() || 0;

                    const effectiveLastMessage =
                        userClearedAt > 0 && lastMsgTime > 0 && lastMsgTime <= userClearedAt
                            ? null
                            : rawConv.lastMessage;

                    if (isGroup) {
                        return {
                            ...rawConv,
                            id: rawConv.id || rawConv.groupId,
                            groupId: rawConv.groupId || rawConv.id,
                            type: 'group',
                            name: rawConv.name || 'Group Workspace',
                            avatar: rawConv.avatar || '',
                            memberCount: rawConv.memberCount || rawConv.members?.length || 0,
                            lastMessage: effectiveLastMessage,
                            unreadCount: rawConv.unreadCounts?.[currentUid] || 0,
                        };
                    }

                    const otherUid = rawConv.participantIds?.find((id) => id !== currentUid);
                    const staticOtherProfile = rawConv.participants?.[otherUid] || null;
                    const liveProfile = cachedUserProfiles.get(otherUid);

                    const otherParticipant = staticOtherProfile
                        ? {
                            uid: staticOtherProfile.uid,
                            fullName: liveProfile?.fullName || staticOtherProfile.fullName || 'User',
                            username: liveProfile?.username || staticOtherProfile.username || 'user',
                            photoURL: liveProfile?.photoURL || staticOtherProfile.photoURL || '',
                            isOnline:
                                liveProfile !== undefined
                                    ? Boolean(liveProfile.isOnline)
                                    : Boolean(staticOtherProfile.isOnline),
                            lastSeen: liveProfile?.lastSeen || staticOtherProfile.lastSeen || null,
                        }
                        : null;

                    return {
                        ...rawConv,
                        type: 'direct',
                        lastMessage: effectiveLastMessage,
                        otherParticipant,
                        unreadCount: rawConv.unreadCounts?.[currentUid] || 0,
                    };
                };

                const sortAndDeliver = () => {
                    const hydratedList = Array.from(rawConversationsMap.values())
                        .filter((rawConv) => {
                            if (rawConv.hiddenFor?.includes(currentUid)) {
                                return false;
                            }
                            if (
                                rawConv.type !== 'group' &&
                                !rawConv.lastMessage &&
                                rawConv.createdBy &&
                                rawConv.createdBy !== currentUid
                            ) {
                                return false;
                            }
                            return true;
                        })
                        .map(buildHydratedConversation);

                    const sortedList = hydratedList.sort((a, b) => {
                        const timeA = a.lastActivity?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
                        const timeB = b.lastActivity?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
                        return timeB - timeA;
                    });

                    callback(sortedList);
                };

                snapshot.docs.forEach((docSnap) => {
                    const conv = docSnap.data();
                    if (conv.type !== 'group') {
                        const otherUid = conv.participantIds?.find((id) => id !== currentUid);
                        if (otherUid && !activeProfileListeners.has(otherUid)) {
                            const otherUserRef = doc(db, 'users', otherUid);
                            const unsubProfile = onSnapshot(
                                otherUserRef,
                                (userSnap) => {
                                    if (userSnap.exists()) {
                                        const liveUserData = userSnap.data();
                                        cachedUserProfiles.set(otherUid, {
                                            uid: liveUserData.uid,
                                            fullName: liveUserData.fullName || 'User',
                                            username: liveUserData.username || 'user',
                                            photoURL: liveUserData.photoURL || '',
                                            isOnline: Boolean(liveUserData.isOnline),
                                            lastSeen: liveUserData.lastSeen || null,
                                        });

                                        sortAndDeliver();
                                    }
                                },
                                (err) => console.warn('[subscribeToUserConversations.profile]:', err.message)
                            );

                            activeProfileListeners.set(otherUid, unsubProfile);
                        }
                    }
                });

                sortAndDeliver();
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
            rawConversationsMap.clear();
        };
    },

    hideConversationForUser: async (conversationId, currentUid) => {
        if (!conversationId || !currentUid) return;
        try {
            const convRef = doc(db, 'conversations', conversationId);
            await updateDoc(convRef, {
                hiddenFor: arrayUnion(currentUid),
                [`clearedAt.${currentUid}`]: serverTimestamp(),
            });
        } catch (error) {
            console.error('[conversationService.hideConversationForUser]:', error);
            throw error;
        }
    },

    deleteConversationAndMessages: async (conversationId) => {
        if (!conversationId) return;
        try {
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const messagesSnap = await getDocs(messagesRef);

            if (!messagesSnap.empty) {
                const docs = messagesSnap.docs;
                const chunkSize = 400;
                for (let i = 0; i < docs.length; i += chunkSize) {
                    const batch = writeBatch(db);
                    const chunk = docs.slice(i, i + chunkSize);
                    chunk.forEach((msgDoc) => {
                        batch.delete(msgDoc.ref);
                    });
                    await batch.commit();
                }
            }

            const convRef = doc(db, 'conversations', conversationId);
            await deleteDoc(convRef);
        } catch (error) {
            console.error('[conversationService.deleteConversationAndMessages]:', error);
            throw error;
        }
    },
};

export default conversationService;