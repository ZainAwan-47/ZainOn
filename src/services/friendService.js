// Third Party Libraries
import {
    collection,
    doc,
    getDoc,
    getDocs,
    writeBatch,
    serverTimestamp,
    query,
    where,
    onSnapshot,
    deleteDoc,
    setDoc
} from 'firebase/firestore';

// Firebase
import { db } from '../firebase/firestore';

export const friendService = {
    getRequestDocId: (senderUid, receiverUid) => {
        return `${senderUid}_${receiverUid}`;
    },

    // NEW: Deep backend check for Friends of Friends
    checkIsFriendOfFriend: async (uidA, uidB) => {
        if (!uidA || !uidB) return false;
        try {
            const friendsASnap = await getDocs(collection(db, 'users', uidA, 'friends'));
            for (const docSnap of friendsASnap.docs) {
                const sharedFriendId = docSnap.id;
                const bFriendRef = doc(db, 'users', uidB, 'friends', sharedFriendId);
                const bFriendSnap = await getDoc(bFriendRef);
                if (bFriendSnap.exists()) return true;
            }
            return false;
        } catch (error) {
            console.error('[checkIsFriendOfFriend]:', error);
            return false;
        }
    },

    sendFriendRequest: async (senderUid, receiverUid) => {
        if (!senderUid || !receiverUid || senderUid === receiverUid) {
            throw new Error('Invalid request parameters.');
        }
        try {
            // Strictly enforce receiver's privacy settings before dispatching
            const receiverDoc = await getDoc(doc(db, 'users', receiverUid));
            if (receiverDoc.exists()) {
                const receiverPrivacy = receiverDoc.data().privacy || {};

                if (receiverPrivacy.friendRequests === 'nobody') {
                    throw new Error('This user is not accepting friend requests.');
                }

                if (receiverPrivacy.friendRequests === 'friends_of_friends') {
                    const isFoF = await friendService.checkIsFriendOfFriend(senderUid, receiverUid);
                    if (!isFoF) {
                        throw new Error('You must share a mutual friend to send a request.');
                    }
                }
            }

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

    acceptFriendRequest: async (requestId, senderUid, receiverUid) => {
        if (!requestId || !senderUid || !receiverUid) return;
        try {
            const batch = writeBatch(db);

            const requestRef = doc(db, 'friendRequests', requestId);
            batch.delete(requestRef);

            const senderFriendRef = doc(db, 'users', senderUid, 'friends', receiverUid);
            batch.set(senderFriendRef, {
                friendUid: receiverUid,
                createdAt: serverTimestamp(),
            });

            const receiverFriendRef = doc(db, 'users', receiverUid, 'friends', senderUid);
            batch.set(receiverFriendRef, {
                friendUid: senderUid,
                createdAt: serverTimestamp(),
            });

            await batch.commit();
        } catch (error) {
            console.warn('[acceptFriendRequest batch failed, executing sequential fallback]:', error);
            try {
                const requestRef = doc(db, 'friendRequests', requestId);
                await deleteDoc(requestRef);

                const receiverFriendRef = doc(db, 'users', receiverUid, 'friends', senderUid);
                await setDoc(receiverFriendRef, {
                    friendUid: senderUid,
                    createdAt: serverTimestamp(),
                });

                const senderFriendRef = doc(db, 'users', senderUid, 'friends', receiverUid);
                await setDoc(senderFriendRef, {
                    friendUid: receiverUid,
                    createdAt: serverTimestamp(),
                });
            } catch (fallbackErr) {
                console.error('[friendService.acceptFriendRequest fallback]:', fallbackErr);
                throw new Error('Failed to accept friend request. Please check permissions.');
            }
        }
    },

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
            console.warn('[friendService.removeFriend fallback]:', error);
            try {
                const refA = doc(db, 'users', userA, 'friends', userB);
                await deleteDoc(refA);
            } catch (fallbackErr) {
                console.error('[friendService.removeFriend error]:', fallbackErr);
                throw fallbackErr;
            }
        }
    },

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
                    const unsubProfile = onSnapshot(
                        userDocRef,
                        (userSnap) => {
                            if (userSnap.exists()) {
                                const data = userSnap.data();
                                const privacy = data.privacy || {};
                                friendProfilesMap.set(friendUid, {
                                    uid: data.uid,
                                    fullName: data.fullName || 'User',
                                    username: data.username || 'user',
                                    photoURL: data.photoURL || '',
                                    bio: data.bio || '',
                                    status: data.status || '',
                                    isOnline: privacy.onlineStatus === false ? false : Boolean(data.isOnline),
                                    lastSeen: privacy.lastSeen === 'nobody' ? null : (data.lastSeen || null),
                                    privacy: privacy
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
                        },
                        (err) => console.warn('[subscribeToFriends.profile]:', err.message)
                    );
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

        const unsubFriend = onSnapshot(
            friendRef,
            (snap) => {
                isFriend = snap.exists();
                evaluateStatus();
            },
            (err) => console.warn('[subscribeToFriendshipStatus.friendRef]:', err.message)
        );

        const unsubOutgoing = onSnapshot(
            outgoingRef,
            (snap) => {
                outgoingRequest = snap.exists() ? { id: snap.id, ...snap.data() } : null;
                evaluateStatus();
            },
            (err) => console.warn('[subscribeToFriendshipStatus.outgoingRef]:', err.message)
        );

        const unsubIncoming = onSnapshot(
            incomingRef,
            (snap) => {
                incomingRequest = snap.exists() ? { id: snap.id, ...snap.data() } : null;
                evaluateStatus();
            },
            (err) => console.warn('[subscribeToFriendshipStatus.incomingRef]:', err.message)
        );

        return () => {
            unsubFriend();
            unsubOutgoing();
            unsubIncoming();
        };
    },
};

export default friendService;