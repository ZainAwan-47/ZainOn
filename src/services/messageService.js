// Third Party Libraries
import {
    collection,
    doc,
    getDoc,
    writeBatch,
    serverTimestamp,
    increment,
    query,
    orderBy,
    limitToLast,
    onSnapshot,
    arrayUnion,
    updateDoc,
} from 'firebase/firestore';

// Firebase
import { db } from '../firebase/firestore';

export const messageService = {
    sendMessage: async (
        conversationId,
        senderId,
        text,
        recipientId,
        replyTo = null,
        isFriend = true // NEW: Track friendship status on send
    ) => {
        const trimmedText = text?.trim();
        if (!conversationId || !senderId || !trimmedText) {
            throw new Error('Invalid message parameters.');
        }

        try {
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const newMessageRef = doc(messagesRef);
            const messageId = newMessageRef.id;

            const batch = writeBatch(db);

            const messageData = {
                id: messageId,
                conversationId,
                senderId,
                text: trimmedText,
                type: 'text',
                createdAt: serverTimestamp(),
                deliveryStatus: 'sent',
                seenBy: [senderId],
                seenAt: { [senderId]: serverTimestamp() }, // Track exact seen time for sender
                consumedBy: [senderId], // Critical for non-retroactive read receipts
                reactions: {},
                isPinned: false,
                isStarred: {},
                replyTo: replyTo
                    ? {
                        id: replyTo.id,
                        text: replyTo.text,
                        senderId: replyTo.senderId,
                        senderName: replyTo.senderName || 'User',
                    }
                    : null,
            };

            batch.set(newMessageRef, messageData);

            const convRef = doc(db, 'conversations', conversationId);
            const convUpdateData = {
                lastMessage: {
                    id: messageId,
                    text: trimmedText,
                    senderId,
                    type: 'text',
                    deliveryStatus: 'sent',
                    createdAt: serverTimestamp(),
                },
                lastActivity: serverTimestamp(),
                updatedAt: serverTimestamp(),
                hiddenFor: [],
            };

            if (recipientId) {
                convUpdateData[`unreadCounts.${recipientId}`] = increment(1);

                // UNBREAKABLE PER-USER LIMIT LOGIC:
                if (!isFriend) {
                    convUpdateData[`nonFriendMessageCounts.${senderId}`] = increment(1);
                } else {
                    convUpdateData.nonFriendMessageCounts = {};
                }
            } else {
                const convSnap = await getDoc(convRef);
                if (convSnap.exists()) {
                    const participants = convSnap.data().participants || {};
                    Object.keys(participants).forEach((uid) => {
                        if (uid !== senderId) {
                            convUpdateData[`unreadCounts.${uid}`] = increment(1);
                        }
                    });
                }
            }

            batch.update(convRef, convUpdateData);
            await batch.commit();

            return messageId;
        } catch (error) {
            console.error('[messageService.sendMessage]:', error);
            throw error;
        }
    },

    subscribeToMessages: (conversationId, currentUid, limitCount = 50, callback) => {
        if (!conversationId) return () => { };

        const convRef = doc(db, 'conversations', conversationId);
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'), limitToLast(limitCount));

        let userClearedAt = 0;

        const unsubConv = onSnapshot(
            convRef,
            (convSnap) => {
                if (convSnap.exists()) {
                    const data = convSnap.data();
                    userClearedAt = data.clearedAt?.[currentUid]?.toMillis?.() || 0;
                }
            },
            (err) => console.warn('[subscribeToMessages.convRef]:', err.message)
        );

        const unsubMessages = onSnapshot(
            q,
            (snapshot) => {
                const messages = snapshot.docs
                    .map((docSnap) => {
                        const data = docSnap.data();
                        return {
                            id: docSnap.id,
                            ...data,
                            createdAt: data.createdAt || new Date(),
                        };
                    })
                    .filter((msg) => {
                        if (!userClearedAt) return true;
                        const msgTime =
                            msg.createdAt?.toMillis?.() ||
                            (msg.createdAt instanceof Date ? msg.createdAt.getTime() : 0);
                        return msgTime > userClearedAt;
                    });

                callback(messages);
            },
            (error) => {
                console.error('[messageService.subscribeToMessages]:', error);
                callback([]);
            }
        );

        return () => {
            unsubConv();
            unsubMessages();
        };
    },

    markAsDelivered: async (conversationId, recipientUid, undeliveredMessages = [], isGroup = false) => {
        if (!conversationId || !recipientUid || undeliveredMessages.length === 0) return;

        try {
            const batch = writeBatch(db);

            undeliveredMessages.forEach((msg) => {
                const msgRef = doc(db, 'conversations', conversationId, 'messages', msg.id);
                batch.update(msgRef, {
                    ...(isGroup ? {} : { deliveryStatus: 'delivered' })
                });
            });

            const convRef = doc(db, 'conversations', conversationId);
            const convSnap = await getDoc(convRef);
            if (convSnap.exists() && !isGroup) {
                const convData = convSnap.data();
                if (
                    convData.lastMessage &&
                    undeliveredMessages.some((m) => m.id === convData.lastMessage.id)
                ) {
                    batch.update(convRef, {
                        'lastMessage.deliveryStatus': 'delivered',
                    });
                }
            }

            await batch.commit();
        } catch (error) {
            console.error('[messageService.markAsDelivered]:', error);
        }
    },

    markAsConsumedOnly: async (conversationId, currentUid, unconsumedMessages = []) => {
        if (!conversationId || !currentUid || unconsumedMessages.length === 0) return;
        try {
            const batch = writeBatch(db);
            unconsumedMessages.forEach((msg) => {
                const msgRef = doc(db, 'conversations', conversationId, 'messages', msg.id);
                batch.update(msgRef, { consumedBy: arrayUnion(currentUid) });
            });
            const convRef = doc(db, 'conversations', conversationId);
            batch.update(convRef, { [`unreadCounts.${currentUid}`]: 0 });
            await batch.commit();
        } catch (error) {
            console.error('[messageService.markAsConsumedOnly]:', error);
        }
    },

    markAsSeen: async (conversationId, currentUid, unseenMessages = [], isGroup = false) => {
        if (!conversationId || !currentUid || unseenMessages.length === 0) return;

        try {
            const batch = writeBatch(db);
            unseenMessages.forEach((msg) => {
                const msgRef = doc(db, 'conversations', conversationId, 'messages', msg.id);
                batch.update(msgRef, {
                    seenBy: arrayUnion(currentUid),
                    [`seenAt.${currentUid}`]: serverTimestamp(), // Record exact precise timestamp when seen
                    consumedBy: arrayUnion(currentUid),
                    ...(isGroup ? {} : { deliveryStatus: 'read' }),
                });
            });

            const convRef = doc(db, 'conversations', conversationId);
            batch.update(convRef, {
                [`unreadCounts.${currentUid}`]: 0,
                ...(isGroup ? {} : { 'lastMessage.deliveryStatus': 'read' }),
            });

            await batch.commit();
        } catch (error) {
            console.error('[messageService.markAsSeen]:', error);
        }
    },

    toggleReaction: async (conversationId, messageId, emoji, currentUid) => {
        if (!conversationId || !messageId || !emoji || !currentUid) return;

        try {
            const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
            const snap = await getDoc(msgRef);
            if (!snap.exists()) return;

            const latestData = snap.data();
            const latestReactions = latestData.reactions || {};
            const existingUsers = latestReactions[emoji] || [];
            const hasReacted = existingUsers.includes(currentUid);

            let updatedUsers;
            if (hasReacted) {
                updatedUsers = existingUsers.filter((id) => id !== currentUid);
            } else {
                updatedUsers = [...existingUsers, currentUid];
            }

            const updatedReactions = { ...latestReactions };
            if (updatedUsers.length === 0) {
                delete updatedReactions[emoji];
            } else {
                updatedReactions[emoji] = updatedUsers;
            }

            await updateDoc(msgRef, { reactions: updatedReactions });
        } catch (error) {
            console.error('[messageService.toggleReaction]:', error);
        }
    },

    togglePinMessage: async (conversationId, message, currentPinnedId) => {
        if (!conversationId || !message) return;

        try {
            const batch = writeBatch(db);
            const convRef = doc(db, 'conversations', conversationId);
            const isCurrentlyPinned = currentPinnedId === message.id;

            if (isCurrentlyPinned) {
                batch.update(convRef, { pinnedMessage: null });
                const msgRef = doc(db, 'conversations', conversationId, 'messages', message.id);
                batch.update(msgRef, { isPinned: false });
            } else {
                batch.update(convRef, {
                    pinnedMessage: {
                        id: message.id,
                        text: message.text,
                        senderId: message.senderId,
                    },
                });
                const msgRef = doc(db, 'conversations', conversationId, 'messages', message.id);
                batch.update(msgRef, { isPinned: true });
            }

            await batch.commit();
        } catch (error) {
            console.error('[messageService.togglePinMessage]:', error);
        }
    },

    toggleStarMessage: async (
        conversationId,
        messageId,
        currentUid,
        currentStarredMap = {}
    ) => {
        if (!conversationId || !messageId || !currentUid) return;

        try {
            const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
            const isStarred = Boolean(currentStarredMap[currentUid]);

            await updateDoc(msgRef, {
                [`isStarred.${currentUid}`]: !isStarred,
            });
        } catch (error) {
            console.error('[messageService.toggleStarMessage]:', error);
        }
    },
};

export default messageService;