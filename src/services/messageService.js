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
    setDoc,
} from 'firebase/firestore';

// Firebase
import { db } from '../firebase/firestore';

const getMillisFromTimestamp = (ts) => {
    if (!ts) return null;
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (ts instanceof Date) return ts.getTime();
    const parsed = new Date(ts).getTime();
    return isNaN(parsed) ? null : parsed;
};

export const messageService = {
    sendMessage: async (
        conversationId,
        senderId,
        text,
        recipientId,
        replyTo = null,
        isFriend = true,
        clientMessageId = null,
        extraData = {} // Added extraData to support call logs
    ) => {
        const trimmedText = text?.trim();
        if (!conversationId || !senderId || !trimmedText) {
            throw new Error('Invalid message parameters.');
        }

        try {
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const newMessageRef = clientMessageId ? doc(messagesRef, clientMessageId) : doc(messagesRef);
            const messageId = newMessageRef.id;

            const batch = writeBatch(db);

            const messageData = {
                id: messageId,
                conversationId,
                senderId,
                text: trimmedText,
                type: extraData.isCallLog ? 'call_log' : 'text',
                createdAt: serverTimestamp(),
                deliveryStatus: 'sent',
                seenBy: [senderId],
                seenAt: { [senderId]: serverTimestamp() },
                consumedBy: [senderId],
                reactions: {},
                isPinned: false,
                isStarred: {},
                isDeleted: false,
                isEdited: false,
                deletedFor: {},
                deletedForEveryone: false,
                replyTo: null,
                ...extraData // Spreads isCallLog, callType, etc.
            };

            batch.set(newMessageRef, messageData);
            // ... rest of sendMessage remains unchanged

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

            const recipientsToNotify = [];

            if (recipientId) {
                convUpdateData[`unreadCounts.${recipientId}`] = increment(1);

                if (!isFriend) {
                    convUpdateData[`nonFriendMessageCounts.${senderId}`] = increment(1);
                } else {
                    convUpdateData.nonFriendMessageCounts = {};
                }
                recipientsToNotify.push(recipientId);
            } else {
                const convSnap = await getDoc(convRef);
                if (convSnap.exists()) {
                    const participants = convSnap.data().participants || {};
                    Object.keys(participants).forEach((uid) => {
                        if (uid !== senderId) {
                            convUpdateData[`unreadCounts.${uid}`] = increment(1);
                            recipientsToNotify.push(uid);
                        }
                    });
                }
            }

            batch.update(convRef, convUpdateData);
            await batch.commit();

            // Emit notifications for inactive direct/group messages
            try {
                const senderDoc = await getDoc(doc(db, 'users', senderId));
                const senderData = senderDoc.exists() ? senderDoc.data() : {};
                const senderName = senderData.fullName || 'User';
                const senderPhoto = senderData.photoURL || '';

                for (const recId of recipientsToNotify) {
                    if (recId === senderId) continue;

                    const isDirect = Boolean(recipientId);
                    const notifType = isDirect ? 'direct_message' : 'group_message';
                    const notifTitle = isDirect ? `New message from ${senderName}` : `New group message`;
                    const notifBody = trimmedText.length > 50 ? `${trimmedText.substring(0, 50)}...` : trimmedText;

                    const notifRef = doc(collection(db, 'users', recId, 'notifications'));
                    await setDoc(notifRef, {
                        id: notifRef.id,
                        type: notifType,
                        title: notifTitle,
                        body: notifBody,
                        read: false,
                        actorId: senderId,
                        actorName: senderName,
                        actorPhotoURL: senderPhoto,
                        targetId: conversationId,
                        messageId: messageId,
                        createdAt: serverTimestamp(),
                    });
                }
            } catch (notifErr) {
                console.warn('[messageService notification emission failed]:', notifErr);
            }

            return messageId;
        } catch (error) {
            console.error('[messageService.sendMessage]:', error);
            throw error;
        }
    },

    editMessage: async (conversationId, messageId, currentUid, newText) => {
        const trimmed = newText?.trim();
        if (!conversationId || !messageId || !currentUid || !trimmed) return;

        try {
            const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
            const msgSnap = await getDoc(msgRef);
            if (!msgSnap.exists()) throw new Error('Message not found.');

            const data = msgSnap.data();
            if (data.senderId !== currentUid) {
                throw new Error('You can only edit your own messages.');
            }

            const createdAtMillis = getMillisFromTimestamp(data.createdAt);
            if (createdAtMillis && Date.now() - createdAtMillis > 60000) {
                throw new Error('Messages can only be edited within 1 minute of sending.');
            }

            await updateDoc(msgRef, {
                text: trimmed,
                isEdited: true,
            });
        } catch (error) {
            console.error('[messageService.editMessage]:', error);
            throw error;
        }
    },

    deleteMessage: async (conversationId, messageId, currentUid, deleteForEveryone = false) => {
        if (!conversationId || !messageId || !currentUid) return;

        try {
            const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);

            if (deleteForEveryone) {
                const msgSnap = await getDoc(msgRef);
                if (!msgSnap.exists()) throw new Error('Message not found.');
                const data = msgSnap.data();

                if (data.senderId !== currentUid) {
                    throw new Error('You can only delete your own messages for everyone.');
                }

                const seenByOthers = (data.seenBy || []).filter(id => id !== currentUid);
                const isUnread = seenByOthers.length === 0;

                if (!isUnread) {
                    let earliestReadMillis = null;
                    const seenAtMap = data.seenAt || {};
                    seenByOthers.forEach(uid => {
                        const millis = getMillisFromTimestamp(seenAtMap[uid]);
                        if (millis && (!earliestReadMillis || millis < earliestReadMillis)) {
                            earliestReadMillis = millis;
                        }
                    });

                    if (!earliestReadMillis) {
                        earliestReadMillis = getMillisFromTimestamp(data.createdAt);
                    }

                    if (earliestReadMillis) {
                        const diffMinutes = (Date.now() - earliestReadMillis) / (1000 * 60);
                        if (diffMinutes > 3) {
                            throw new Error('Read messages cannot be deleted for everyone after 3 minutes of being read.');
                        }
                    }
                }

                await updateDoc(msgRef, {
                    text: 'This message was deleted',
                    isDeleted: true,
                    deletedForEveryone: true,
                    mediaUrl: null,
                    reactions: {},
                });
            } else {
                await updateDoc(msgRef, {
                    [`deletedFor.${currentUid}`]: true,
                });
            }
        } catch (error) {
            console.error('[messageService.deleteMessage]:', error);
            throw error;
        }
    },

    deleteMultipleMessages: async (conversationId, messageIds = [], currentUid, deleteForEveryone = false) => {
        if (!conversationId || messageIds.length === 0 || !currentUid) return;

        try {
            const batch = writeBatch(db);

            if (deleteForEveryone) {
                const messagePromises = messageIds.map((id) =>
                    getDoc(doc(db, 'conversations', conversationId, 'messages', id))
                );
                const snapshots = await Promise.all(messagePromises);

                snapshots.forEach((msgSnap) => {
                    if (!msgSnap.exists()) return;
                    const data = msgSnap.data();
                    if (data.senderId !== currentUid) return;

                    const seenByOthers = (data.seenBy || []).filter(id => id !== currentUid);
                    const isUnread = seenByOthers.length === 0;

                    let allowDelete = true;
                    if (!isUnread) {
                        let earliestReadMillis = null;
                        const seenAtMap = data.seenAt || {};
                        seenByOthers.forEach(uid => {
                            const millis = getMillisFromTimestamp(seenAtMap[uid]);
                            if (millis && (!earliestReadMillis || millis < earliestReadMillis)) {
                                earliestReadMillis = millis;
                            }
                        });

                        if (!earliestReadMillis) {
                            earliestReadMillis = getMillisFromTimestamp(data.createdAt);
                        }

                        if (earliestReadMillis) {
                            const diffMinutes = (Date.now() - earliestReadMillis) / (1000 * 60);
                            if (diffMinutes > 3) allowDelete = false;
                        }
                    }

                    if (allowDelete) {
                        const msgRef = doc(db, 'conversations', conversationId, 'messages', msgSnap.id);
                        batch.update(msgRef, {
                            text: 'This message was deleted',
                            isDeleted: true,
                            deletedForEveryone: true,
                            mediaUrl: null,
                            reactions: {},
                        });
                    }
                });
            } else {
                messageIds.forEach((messageId) => {
                    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
                    batch.update(msgRef, {
                        [`deletedFor.${currentUid}`]: true,
                    });
                });
            }

            await batch.commit();
        } catch (error) {
            console.error('[messageService.deleteMultipleMessages]:', error);
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
                        if (msg.deletedFor?.[currentUid]) return false;
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
                    [`seenAt.${currentUid}`]: serverTimestamp(),
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
            const currentEmojiUsers = latestReactions[emoji] || [];
            const hasReactedToThis = currentEmojiUsers.includes(currentUid);

            const updatedReactions = {};
            Object.keys(latestReactions).forEach((key) => {
                const filteredUsers = latestReactions[key].filter((id) => id !== currentUid);
                if (filteredUsers.length > 0) {
                    updatedReactions[key] = filteredUsers;
                }
            });

            if (!hasReactedToThis) {
                updatedReactions[emoji] = [...(updatedReactions[emoji] || []), currentUid];
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