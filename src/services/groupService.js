// Third Party Libraries
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    query,
    where,
    writeBatch,
} from 'firebase/firestore';

// Firebase & Constants
import { db } from '../firebase/firestore';
import {
    GROUP_ROLES,
    GROUP_STATUS,
    GROUP_LIMITS,
    ROLE_PERMISSIONS_MAP,
    DEFAULT_GROUP_AVATARS,
} from '../constants/groupConstants';

/**
 * Standardizes raw Firebase/Firestore errors into friendly user messages.
 */
const formatGroupError = (error) => {
    if (!error) return 'An unexpected error occurred.';
    const message = error.message || error.toString();
    if (message.includes('permission-denied') || error.code === 'permission-denied') {
        return 'You do not have permission to perform this action.';
    }
    if (message.includes('not-found') || error.code === 'not-found') {
        return 'The requested group space could not be found.';
    }
    return message;
};

export const groupService = {
    /**
     * Helper: Checks if a role possesses a specific permission.
     */
    hasPermission: (role, permission) => {
        if (!role || !permission) return false;
        const permissions = ROLE_PERMISSIONS_MAP[role] || [];
        return permissions.includes(permission);
    },

    /**
     * Atomically creates a group workspace and synced conversation document.
     */
    createGroup: async ({ name, description = '', avatar = '', owner, selectedFriends = [] }) => {
        if (!owner?.uid) {
            throw new Error('Group creation requires an authenticated owner.');
        }

        const trimmedName = name?.trim();
        if (!trimmedName) {
            throw new Error('Group name is required.');
        }

        if (trimmedName.length > GROUP_LIMITS.MAX_NAME_LENGTH) {
            throw new Error(`Group name cannot exceed ${GROUP_LIMITS.MAX_NAME_LENGTH} characters.`);
        }

        if (selectedFriends.length < GROUP_LIMITS.MIN_SELECTED_FRIENDS) {
            throw new Error(`Select at least ${GROUP_LIMITS.MIN_SELECTED_FRIENDS} friends to create a group.`);
        }

        const totalMembers = selectedFriends.length + 1;
        if (totalMembers > GROUP_LIMITS.MAX_MEMBERS) {
            throw new Error(`Group cannot exceed ${GROUP_LIMITS.MAX_MEMBERS} members.`);
        }

        try {
            const batch = writeBatch(db);

            const groupRef = doc(collection(db, 'groups'));
            const groupId = groupRef.id;
            const convRef = doc(db, 'conversations', groupId);

            // Deduplicate member UIDs defensively
            const uniqueFriendMap = new Map();
            selectedFriends.forEach((f) => {
                if (f.uid && f.uid !== owner.uid) {
                    uniqueFriendMap.set(f.uid, f);
                }
            });

            const uniqueFriends = Array.from(uniqueFriendMap.values());
            const members = [owner.uid, ...uniqueFriends.map((f) => f.uid)];

            const roles = {
                [owner.uid]: GROUP_ROLES.OWNER,
            };

            const unreadCounts = {
                [owner.uid]: 0,
            };

            const participants = {
                [owner.uid]: {
                    uid: owner.uid,
                    fullName: owner.fullName || owner.displayName || 'Owner',
                    username: owner.username || 'owner',
                    photoURL: owner.photoURL || '',
                },
            };

            uniqueFriends.forEach((friend) => {
                roles[friend.uid] = GROUP_ROLES.MEMBER;
                unreadCounts[friend.uid] = 0;
                participants[friend.uid] = {
                    uid: friend.uid,
                    fullName: friend.fullName || 'User',
                    username: friend.username || 'user',
                    photoURL: friend.photoURL || '',
                };
            });

            const fallbackAvatar = avatar?.trim() || DEFAULT_GROUP_AVATARS[0];

            // 1. Domain Document: groups/{groupId}
            const groupData = {
                groupId,
                name: trimmedName,
                description: description?.trim() || '',
                avatar: fallbackAvatar,
                ownerId: owner.uid,
                admins: [owner.uid],
                members,
                roles,
                participants,
                memberCount: members.length,
                status: GROUP_STATUS.ACTIVE,
                isArchived: false,
                isMuted: false,
                callActive: false,
                currentCallId: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastActivity: serverTimestamp(),
                lastMessage: null,
            };

            batch.set(groupRef, groupData);

            // 2. Messaging Engine Shadow Document: conversations/{groupId}
            const conversationData = {
                id: groupId,
                type: 'group',
                groupId,
                name: trimmedName,
                avatar: fallbackAvatar,
                createdBy: owner.uid,
                participantIds: members,
                members,
                participants,
                hiddenFor: [],
                clearedAt: {},
                unreadCounts,
                lastMessage: null,
                lastActivity: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            batch.set(convRef, conversationData);

            await batch.commit();
            return groupId;
        } catch (error) {
            console.error('[groupService.createGroup]:', error);
            throw new Error(formatGroupError(error));
        }
    },

    /**
     * Fetches single group document.
     */
    getGroup: async (groupId) => {
        if (!groupId) return null;
        try {
            const groupRef = doc(db, 'groups', groupId);
            const snap = await getDoc(groupRef);
            return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        } catch (error) {
            console.error('[groupService.getGroup]:', error);
            return null;
        }
    },

    /**
     * Updates Group Metadata atomically across groups and conversations collections.
     */
    updateGroup: async (groupId, { name, description, avatar }) => {
        if (!groupId) return;

        try {
            const batch = writeBatch(db);
            const groupRef = doc(db, 'groups', groupId);
            const convRef = doc(db, 'conversations', groupId);

            const groupUpdates = { updatedAt: serverTimestamp() };
            const convUpdates = { updatedAt: serverTimestamp() };

            if (name !== undefined) {
                const trimmedName = name.trim();
                if (!trimmedName) throw new Error('Group name cannot be empty.');
                groupUpdates.name = trimmedName;
                convUpdates.name = trimmedName;
            }

            if (description !== undefined) {
                groupUpdates.description = description.trim();
            }

            if (avatar !== undefined && avatar.trim()) {
                groupUpdates.avatar = avatar.trim();
                convUpdates.avatar = avatar.trim();
            }

            batch.update(groupRef, groupUpdates);
            batch.update(convRef, convUpdates);

            await batch.commit();
        } catch (error) {
            console.error('[groupService.updateGroup]:', error);
            throw new Error(formatGroupError(error));
        }
    },

    /**
     * Adds new members to an existing group.
     */
    addMember: async (groupId, newFriends = []) => {
        if (!groupId || newFriends.length === 0) return;

        try {
            const groupRef = doc(db, 'groups', groupId);
            const convRef = doc(db, 'conversations', groupId);

            const snap = await getDoc(groupRef);
            if (!snap.exists()) throw new Error('Group space does not exist.');

            const groupData = snap.data();
            const currentMembers = groupData.members || [];
            const newMemberUids = newFriends.map((f) => f.uid);

            const updatedMembers = [...new Set([...currentMembers, ...newMemberUids])];
            if (updatedMembers.length > GROUP_LIMITS.MAX_MEMBERS) {
                throw new Error(`Adding members exceeds maximum limit (${GROUP_LIMITS.MAX_MEMBERS}).`);
            }

            const rolesUpdate = { ...groupData.roles };
            const participantsUpdate = { ...groupData.participants };
            const unreadCountsUpdate = {};

            newFriends.forEach((f) => {
                rolesUpdate[f.uid] = GROUP_ROLES.MEMBER;
                participantsUpdate[f.uid] = {
                    uid: f.uid,
                    fullName: f.fullName || 'User',
                    username: f.username || 'user',
                    photoURL: f.photoURL || '',
                };
                unreadCountsUpdate[`unreadCounts.${f.uid}`] = 0;
            });

            const batch = writeBatch(db);

            batch.update(groupRef, {
                members: updatedMembers,
                roles: rolesUpdate,
                participants: participantsUpdate,
                memberCount: updatedMembers.length,
                updatedAt: serverTimestamp(),
            });

            batch.update(convRef, {
                members: updatedMembers,
                participantIds: updatedMembers,
                participants: participantsUpdate,
                ...unreadCountsUpdate,
                updatedAt: serverTimestamp(),
            });

            await batch.commit();
        } catch (error) {
            console.error('[groupService.addMember]:', error);
            throw new Error(formatGroupError(error));
        }
    },

    /**
     * Removes a member from the group.
     */
    removeMember: async (groupId, targetUid) => {
        if (!groupId || !targetUid) return;

        try {
            const groupRef = doc(db, 'groups', groupId);
            const convRef = doc(db, 'conversations', groupId);

            const snap = await getDoc(groupRef);
            if (!snap.exists()) return;

            const data = snap.data();
            if (data.ownerId === targetUid) {
                throw new Error('Cannot remove the Group Owner. Transfer ownership first.');
            }

            const updatedMembers = (data.members || []).filter((id) => id !== targetUid);
            const updatedAdmins = (data.admins || []).filter((id) => id !== targetUid);

            const updatedRoles = { ...data.roles };
            delete updatedRoles[targetUid];

            const updatedParticipants = { ...data.participants };
            delete updatedParticipants[targetUid];

            const batch = writeBatch(db);

            batch.update(groupRef, {
                members: updatedMembers,
                admins: updatedAdmins,
                roles: updatedRoles,
                participants: updatedParticipants,
                memberCount: updatedMembers.length,
                updatedAt: serverTimestamp(),
            });

            batch.update(convRef, {
                members: updatedMembers,
                participantIds: updatedMembers,
                participants: updatedParticipants,
                updatedAt: serverTimestamp(),
            });

            await batch.commit();
        } catch (error) {
            console.error('[groupService.removeMember]:', error);
            throw new Error(formatGroupError(error));
        }
    },

    /**
     * Allows member to leave group self-initiated.
     */
    leaveGroup: async (groupId, currentUid) => {
        if (!groupId || !currentUid) return;

        const groupRef = doc(db, 'groups', groupId);
        const snap = await getDoc(groupRef);
        if (!snap.exists()) return;

        const data = snap.data();
        if (data.ownerId === currentUid) {
            throw new Error('Group Owner cannot leave without transferring ownership first.');
        }

        await groupService.removeMember(groupId, currentUid);
    },

    /**
     * Promotes member to Admin.
     */
    promoteAdmin: async (groupId, targetUid) => {
        if (!groupId || !targetUid) return;

        try {
            const groupRef = doc(db, 'groups', groupId);
            const snap = await getDoc(groupRef);
            if (!snap.exists()) return;

            const data = snap.data();
            const updatedAdmins = [...new Set([...(data.admins || []), targetUid])];

            await groupService.updateMemberRoleInternal(groupId, targetUid, GROUP_ROLES.ADMIN, updatedAdmins);
        } catch (error) {
            console.error('[groupService.promoteAdmin]:', error);
            throw new Error(formatGroupError(error));
        }
    },

    /**
     * Demotes Admin to Member.
     */
    demoteAdmin: async (groupId, targetUid) => {
        if (!groupId || !targetUid) return;

        try {
            const groupRef = doc(db, 'groups', groupId);
            const snap = await getDoc(groupRef);
            if (!snap.exists()) return;

            const data = snap.data();
            if (data.ownerId === targetUid) {
                throw new Error('Cannot demote Group Owner.');
            }

            const updatedAdmins = (data.admins || []).filter((id) => id !== targetUid);

            await groupService.updateMemberRoleInternal(groupId, targetUid, GROUP_ROLES.MEMBER, updatedAdmins);
        } catch (error) {
            console.error('[groupService.demoteAdmin]:', error);
            throw new Error(formatGroupError(error));
        }
    },

    /**
     * Internal helper for role updates.
     */
    updateMemberRoleInternal: async (groupId, targetUid, newRole, updatedAdmins) => {
        const groupRef = doc(db, 'groups', groupId);
        await groupRef;
        const batch = writeBatch(db);

        batch.update(groupRef, {
            [`roles.${targetUid}`]: newRole,
            admins: updatedAdmins,
            updatedAt: serverTimestamp(),
        });

        await batch.commit();
    },

    /**
     * Transfers ownership to another group member.
     */
    transferOwnership: async (groupId, currentOwnerUid, newOwnerUid) => {
        if (!groupId || !currentOwnerUid || !newOwnerUid) return;

        try {
            const groupRef = doc(db, 'groups', groupId);
            const snap = await getDoc(groupRef);
            if (!snap.exists()) return;

            const data = snap.data();
            if (data.ownerId !== currentOwnerUid) {
                throw new Error('Only current owner can transfer ownership.');
            }

            if (!data.members.includes(newOwnerUid)) {
                throw new Error('New owner must be an active group member.');
            }

            const updatedAdmins = [...new Set([...(data.admins || []), newOwnerUid])];

            const batch = writeBatch(db);
            batch.update(groupRef, {
                ownerId: newOwnerUid,
                admins: updatedAdmins,
                [`roles.${currentOwnerUid}`]: GROUP_ROLES.ADMIN,
                [`roles.${newOwnerUid}`]: GROUP_ROLES.OWNER,
                updatedAt: serverTimestamp(),
            });

            await batch.commit();
        } catch (error) {
            console.error('[groupService.transferOwnership]:', error);
            throw new Error(formatGroupError(error));
        }
    },

    /**
     * Deletes group workspace and synced conversation document.
     */
    deleteGroup: async (groupId) => {
        if (!groupId) return;

        try {
            const batch = writeBatch(db);
            const groupRef = doc(db, 'groups', groupId);
            const convRef = doc(db, 'conversations', groupId);

            batch.delete(groupRef);
            batch.delete(convRef);

            await batch.commit();
        } catch (error) {
            console.error('[groupService.deleteGroup]:', error);
            throw new Error(formatGroupError(error));
        }
    },

    /**
     * Realtime single group subscriber.
     */
    subscribeToGroup: (groupId, callback) => {
        if (!groupId) return () => { };
        const groupRef = doc(db, 'groups', groupId);
        return onSnapshot(
            groupRef,
            (snap) => {
                if (snap.exists()) {
                    callback({ id: snap.id, ...snap.data() });
                } else {
                    callback(null);
                }
            },
            (error) => {
                console.error('[groupService.subscribeToGroup]:', error);
                callback(null);
            }
        );
    },

    /**
     * Realtime user groups subscriber.
     */
    subscribeToUserGroups: (currentUid, callback) => {
        if (!currentUid) return () => { };

        const q = query(
            collection(db, 'groups'),
            where('members', 'array-contains', currentUid)
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const groups = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                }));

                const sortedGroups = groups.sort((a, b) => {
                    const timeA = a.lastActivity?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
                    const timeB = b.lastActivity?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
                    return timeB - timeA;
                });

                callback(sortedGroups);
            },
            (error) => {
                console.error('[groupService.subscribeToUserGroups]:', error);
                callback([]);
            }
        );
    },
};

export default groupService;