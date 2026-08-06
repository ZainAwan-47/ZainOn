// Third Party Libraries
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    onSnapshot,
    writeBatch,
    serverTimestamp,
    query,
    where,
} from 'firebase/firestore';

// Firebase
import { db } from '../firebase/firestore';

export const friendService = {
    /**
     * Generates a deterministic friend request document key.
     * @param {string} senderUid
     * @param {string} receiverUid
     * @returns {string}
     */
    getRequestDocId: (senderUid, receiverUid) => {
        return `${senderUid}_${receiverUid}`;
    },

    /**
     * Sends a friend request from senderUid to receiverUid.
     * @param {string} senderUid
     * @param {string} receiverUid
     * @returns {Promise<void>}
     */
    sendFriendRequest: async (senderUid, receiverUid) => {
        if (!senderUid || !receiverUid || senderUid === receiverUid) {
            throw new Error('Invalid request parameters.');
        }

        try {
            const friendDocRef = doc(db, 'users', senderUid, 'friends', receiverUid);
            const friendSnap = await getDoc(friendDocRef);
            if (friendSnap.exists()) {
                throw new Error('You are already friends with this user.');
            }

            const requestId = friendService.getRequestDocId(senderUid, receiverUid);
            const requestRef = doc(db, 'friendRequests', requestId);

            await setDoc(requestRef, {
                id: requestId,
                senderUid,
                receiverUid,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('[friendService.sendFriendRequest]:', error);
            throw error;
        }
    },

    /**
     * Cancels an outgoing friend request.
     * @param {string} senderUid
     * @param {string} receiverUid
     * @returns {Promise<void>}
     */
    cancelFriendRequest: async (senderUid, receiverUid) => {
        if (!senderUid || !receiverUid) return;

        try {
            const requestId = friendService.getRequestDocId(senderUid, receiverUid);
            const requestRef = doc(db, 'friendRequests', requestId);
            await deleteDoc(requestRef);
        } catch (error) {
            console.error('[friendService.cancelFriendRequest]:', error);
            throw error;
        }
    },

    /**
     * Accepts an incoming friend request atomically across both user subcollections.
     * @param {string} requestId
     * @param {string} senderUid
     * @param {string} receiverUid
     * @returns {Promise<void>}
     */
    acceptFriendRequest: async (requestId, senderUid, receiverUid) => {
        if (!requestId || !senderUid || !receiverUid) return;

        try {
            const batch = writeBatch(db);

            // 1. Delete request doc
            const requestRef = doc(db, 'friendRequests', requestId);
            batch.delete(requestRef);

            // 2. Add friend record to sender's subcollection
            const senderFriendRef = doc(db, 'users', senderUid, 'friends', receiverUid);
            batch.set(senderFriendRef, {
                friendUid: receiverUid,
                createdAt: serverTimestamp(),
            });

            // 3. Add friend record to receiver's subcollection
            const receiverFriendRef = doc(db, 'users', receiverUid, 'friends', senderUid);
            batch.set(receiverFriendRef, {
                friendUid: senderUid,
                createdAt: serverTimestamp(),
            });

            await batch.commit();
        } catch (error) {
            console.error('[friendService.acceptFriendRequest]:', error);
            throw new Error('Failed to accept friend request. Please check permissions.');
        }
    },

    /**
     * Declines an incoming friend request.
     * @param {string} requestId
     * @returns {Promise<void>}
     */
    declineFriendRequest: async (requestId) => {
        if (!requestId) return;

        try {
            const requestRef = doc(db, 'friendRequests', requestId);
            await deleteDoc(requestRef);
        } catch (error) {
            console.error('[friendService.declineFriendRequest]:', error);
            throw error;
        }
    },

    /**
     * Removes a friend relationship atomically from both users.
     * @param {string} userA
     * @param {string} userB
     * @returns {Promise<void>}
     */
    removeFriend: async (userA, userB) => {
        if (!userA || !userB) return;

        try {
            const batch = writeBatch(db);

            const refA = doc(db, 'users', userA, 'friends', userB);
            const refB = doc(db, 'users', userB, 'friends', userA);

            batch.delete(refA);
            batch.delete(refB);

            await batch.commit();
        } catch (error) {
            console.error('[friendService.removeFriend]:', error);
            throw error;
        }
    },

    /**
     * Listens in real time to the current user's friends list and attaches profile listeners for live presence updates.
     * @param {string} uid
     * @param {function(Array<Object>): void} callback
     * @returns {function(): void} Unsubscribe function
     */
    subscribeToFriends: (uid, callback) => {
        if (!uid) return () => { };

        const friendsRef = collection(db, 'users', uid, 'friends');
        let profileUnsubscribes = [];

        const unsubSubcollection = onSnapshot(
            friendsRef,
            (snapshot) => {
                profileUnsubscribes.forEach((unsub) => unsub());
                profileUnsubscribes = [];

                const friendUids = snapshot.docs.map((docSnap) => docSnap.id);

                if (friendUids.length === 0) {
                    callback([]);
                    return;
                }

                const friendProfilesMap = new Map();

                friendUids.forEach((friendUid) => {
                    const userDocRef = doc(db, 'users', friendUid);
                    const unsubProfile = onSnapshot(userDocRef, (userSnap) => {
                        if (userSnap.exists()) {
                            const data = userSnap.data();
                            friendProfilesMap.set(friendUid, {
                                uid: data.uid,
                                fullName: data.fullName || 'User',
                                username: data.username || 'user',
                                photoURL: data.photoURL || '',
                                bio: data.bio || '',
                                status: data.status || '',
                                isOnline: Boolean(data.isOnline),
                                lastSeen: data.lastSeen || null,
                            });
                        } else {
                            friendProfilesMap.delete(friendUid);
                        }

                        const sortedProfiles = Array.from(friendProfilesMap.values()).sort((a, b) => {
                            if (a.isOnline === b.isOnline) {
                                return a.fullName.localeCompare(b.fullName);
                            }
                            return a.isOnline ? -1 : 1;
                        });

                        callback(sortedProfiles);
                    });

                    profileUnsubscribes.push(unsubProfile);
                });
            },
            (error) => {
                console.error('[friendService.subscribeToFriends]:', error);
                callback([]);
            }
        );

        return () => {
            unsubSubcollection();
            profileUnsubscribes.forEach((unsub) => unsub());
        };
    },

    /**
     * Listens in real time to incoming friend requests.
     * @param {string} uid
     * @param {function(Array<Object>): void} callback
     * @returns {function(): void} Unsubscribe function
     */
    subscribeToIncomingRequests: (uid, callback) => {
        if (!uid) return () => { };

        const q = query(
            collection(db, 'friendRequests'),
            where('receiverUid', '==', uid),
            where('status', '==', 'pending')
        );

        return onSnapshot(
            q,
            async (snapshot) => {
                const requestsPromises = snapshot.docs.map(async (docSnap) => {
                    const reqData = docSnap.data();
                    const senderDocRef = doc(db, 'users', reqData.senderUid);
                    const senderSnap = await getDoc(senderDocRef);

                    return {
                        id: reqData.id,
                        senderUid: reqData.senderUid,
                        receiverUid: reqData.receiverUid,
                        createdAt: reqData.createdAt,
                        senderProfile: senderSnap.exists()
                            ? senderSnap.data()
                            : { fullName: 'User', username: 'user' },
                    };
                });

                const hydratedRequests = await Promise.all(requestsPromises);
                callback(hydratedRequests);
            },
            (error) => {
                console.error('[friendService.subscribeToIncomingRequests]:', error);
                callback([]);
            }
        );
    },

    /**
     * Parallel Multi-Stream Friendship Status Resolver.
     * Listens to friends subcollection, outgoing requests, and incoming requests simultaneously.
     * @param {string} currentUid
     * @param {string} targetUid
     * @param {function(string, Object|null): void} callback
     * @returns {function(): void} Clean composite unsubscriber
     */
    subscribeToFriendshipStatus: (currentUid, targetUid, callback) => {
        if (!currentUid || !targetUid || currentUid === targetUid) {
            callback('NOT_FRIENDS', null);
            return () => { };
        }

        let isFriend = false;
        let outgoingRequest = null;
        let incomingRequest = null;

        const evaluateStatus = () => {
            if (isFriend) {
                callback('FRIENDS', null);
            } else if (outgoingRequest) {
                callback('REQUEST_SENT', outgoingRequest);
            } else if (incomingRequest) {
                callback('REQUEST_RECEIVED', incomingRequest);
            } else {
                callback('NOT_FRIENDS', null);
            }
        };

        const friendRef = doc(db, 'users', currentUid, 'friends', targetUid);
        const outgoingId = friendService.getRequestDocId(currentUid, targetUid);
        const outgoingRef = doc(db, 'friendRequests', outgoingId);
        const incomingId = friendService.getRequestDocId(targetUid, currentUid);
        const incomingRef = doc(db, 'friendRequests', incomingId);

        // 1. Parallel listener for active friendship record
        const unsubFriend = onSnapshot(
            friendRef,
            (snap) => {
                isFriend = snap.exists();
                evaluateStatus();
            },
            (error) => console.error('[subscribeToFriendshipStatus.friendRef]:', error)
        );

        // 2. Parallel listener for outgoing friend request
        const unsubOutgoing = onSnapshot(
            outgoingRef,
            (snap) => {
                outgoingRequest = snap.exists() ? { id: snap.id, ...snap.data() } : null;
                evaluateStatus();
            },
            (error) => console.error('[subscribeToFriendshipStatus.outgoingRef]:', error)
        );

        // 3. Parallel listener for incoming friend request
        const unsubIncoming = onSnapshot(
            incomingRef,
            (snap) => {
                incomingRequest = snap.exists() ? { id: snap.id, ...snap.data() } : null;
                evaluateStatus();
            },
            (error) => console.error('[subscribeToFriendshipStatus.incomingRef]:', error)
        );

        // Unified unsubscriber cleans up all 3 listeners on unmount
        return () => {
            unsubFriend();
            unsubOutgoing();
            unsubIncoming();
        };
    },
};

export default friendService;