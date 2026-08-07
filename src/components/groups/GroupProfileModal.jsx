// React
import React, { useState, useMemo, useEffect, memo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

// Third Party Libraries
import { motion, AnimatePresence } from 'framer-motion';

// Services & Hooks
import { db } from '../../firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { groupService } from '../../services/groupService';
import { useToast } from '../../context/ToastContext';
import { GROUP_ROLES } from '../../constants/groupConstants';
import { useGroups } from '../../hooks/useGroups';
import { useConversations } from '../../hooks/useConversations';
import { useFriends } from '../../hooks/useFriends';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';
import InviteMembersModal from './InviteMembersModal';
import FriendActionButton from '../friends/FriendActionButton';
import ProfilePreviewModal from '../friends/ProfilePreviewModal';

// Sub-component to guarantee LIVE presence and privacy for each member
const GroupMemberItem = memo(({
    member,
    realtimeGroup,
    currentUserUid,
    friends,
    isAdmin,
    isOwner,
    onRoleChange,
    onRemove,
    onTransfer,
    onSelectProfile
}) => {
    const isSelf = member.uid === currentUserUid;
    const [liveUser, setLiveUser] = useState(member);

    // Attach real-time snapshot for this specific member
    useEffect(() => {
        if (isSelf) return;
        const unsub = onSnapshot(doc(db, 'users', member.uid || member.id), (snap) => {
            if (snap.exists()) setLiveUser({ ...snap.data(), uid: snap.id });
        });
        return () => unsub();
    }, [isSelf, member.uid, member.id]);

    const role = realtimeGroup.roles?.[liveUser.uid] || GROUP_ROLES.MEMBER;
    const isMemberOwner = role === GROUP_ROLES.OWNER;
    const isMemberAdmin = role === GROUP_ROLES.ADMIN;
    const displayName = liveUser.fullName || liveUser.displayName || liveUser.username || 'User';

    // Strict Privacy Logic Cascading
    const isFriend = friends.some(f => (f.uid || f.id) === liveUser.uid);
    const onlineStatusEnabled = liveUser.privacy?.onlineStatus !== false;
    const isOnlineEffective = isSelf ? true : (onlineStatusEnabled ? liveUser.isOnline : false);

    const lastSeenSetting = liveUser.privacy?.lastSeen || 'everyone';
    let lastSeenEffective = liveUser.lastSeen;
    if (lastSeenSetting === 'nobody') lastSeenEffective = null;
    else if (lastSeenSetting === 'friends' && !isFriend) lastSeenEffective = null;
    if (isSelf) lastSeenEffective = null; // Do not show last seen for yourself

    return (
        <div className="p-2.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2 transition-colors duration-300">
            <div
                className={`flex items-center space-x-2.5 flex-1 min-w-[150px] p-1 -ml-1 rounded-xl transition-colors ${!isSelf ? 'cursor-pointer hover:bg-[var(--bg-surface-hover)]' : ''}`}
                onClick={() => !isSelf && onSelectProfile(liveUser)}
                title={!isSelf ? "View Profile" : ""}
            >
                <Avatar
                    src={liveUser.photoURL}
                    name={displayName}
                    size="sm"
                    isOnline={isOnlineEffective}
                />
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {displayName}
                        </span>
                        {isSelf && <span className="text-[9px] text-[var(--color-primary)] font-bold shrink-0">(You)</span>}
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] truncate">
                        @{liveUser.username || 'user'}
                    </span>
                    <div className="mt-0.5">
                        <PresenceIndicator
                            isOnline={isOnlineEffective}
                            lastSeen={lastSeenEffective}
                            size="sm"
                            onlineStatusEnabled={onlineStatusEnabled}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 ml-auto">
                {!isSelf && (
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <FriendActionButton targetUser={liveUser} />
                    </div>
                )}

                <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${isMemberOwner
                        ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20'
                        : isMemberAdmin
                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20'
                            : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'
                        }`}
                >
                    {role}
                </span>

                {!isSelf && (
                    <div className="flex items-center space-x-1 shrink-0">
                        {isOwner && (
                            <>
                                {!isMemberAdmin ? (
                                    <button
                                        type="button"
                                        onClick={() => onRoleChange(liveUser.uid, GROUP_ROLES.ADMIN)}
                                        className="p-1 text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                                        title="Promote to Admin"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => onRoleChange(liveUser.uid, GROUP_ROLES.MEMBER)}
                                        className="p-1 text-[var(--text-secondary)] hover:text-[var(--color-warning)] transition-colors cursor-pointer"
                                        title="Demote to Member"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
                                        </svg>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => onTransfer(liveUser.uid)}
                                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--color-success)] transition-colors cursor-pointer"
                                    title="Transfer Ownership"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </button>
                            </>
                        )}

                        {isAdmin && !isMemberOwner && (
                            <button
                                type="button"
                                onClick={() => onRemove(liveUser.uid)}
                                className="p-1 text-[var(--text-secondary)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                                title="Remove Member"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

export const GroupProfileModal = memo(({ group, isOpen, onClose }) => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const { groups = [] } = useGroups() || {};
    const { conversations = [] } = useConversations() || {};
    const { friends = [] } = useFriends() || {};

    const [loadingAction, setLoadingAction] = useState(false);
    const [editing, setEditing] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedMemberProfile, setSelectedMemberProfile] = useState(null);

    const realtimeGroup = useMemo(() => {
        if (!group) return null;
        return groups.find(g => g.id === group.id)
            || conversations.find(c => c.id === group.id)
            || group;
    }, [group, groups, conversations]);

    const [name, setName] = useState(realtimeGroup?.name || '');
    const [description, setDescription] = useState(realtimeGroup?.description || '');

    if (!isOpen || !realtimeGroup) return null;

    const currentRole = realtimeGroup.roles?.[user?.uid] || GROUP_ROLES.MEMBER;
    const isOwner = currentRole === GROUP_ROLES.OWNER;
    const isAdmin = isOwner || currentRole === GROUP_ROLES.ADMIN;

    const activeMemberUids = new Set(realtimeGroup.members || []);
    const memberList = Object.values(realtimeGroup.participants || {})
        .filter(member => activeMemberUids.has(member.uid || member.id));

    let formattedCreatedDate = '';
    if (realtimeGroup.createdAt?.toDate) {
        formattedCreatedDate = realtimeGroup.createdAt.toDate().toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }

    const handleSaveMetadata = async () => {
        if (!name.trim()) {
            showToast('Group name cannot be empty.', 'error');
            return;
        }
        try {
            setLoadingAction(true);
            await groupService.updateGroup(realtimeGroup.id, { name, description });
            showToast('Group details updated.', 'info');
            setEditing(false);
        } catch (err) {
            showToast(err.message || 'Failed to update group.', 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleRoleChange = async (targetUid, newRole) => {
        if (loadingAction) return;
        try {
            setLoadingAction(true);
            if (newRole === GROUP_ROLES.ADMIN) {
                await groupService.promoteAdmin(realtimeGroup.id, targetUid);
                showToast('Promoted member to Admin.', 'info');
            } else {
                await groupService.demoteAdmin(realtimeGroup.id, targetUid);
                showToast('Demoted admin to Member.', 'info');
            }
        } catch (err) {
            showToast(err.message || 'Failed to update member role.', 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleTransferOwnership = async (targetUid) => {
        if (loadingAction) return;
        try {
            setLoadingAction(true);
            await groupService.transferOwnership(realtimeGroup.id, user.uid, targetUid);
            showToast('Group ownership transferred.', 'info');
        } catch (err) {
            showToast(err.message || 'Failed to transfer ownership.', 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleRemoveMember = async (targetUid) => {
        if (loadingAction) return;
        try {
            setLoadingAction(true);
            await groupService.removeMember(realtimeGroup.id, targetUid);
            showToast('Member removed from group.', 'info');
        } catch (err) {
            showToast(err.message || 'Failed to remove member.', 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleLeaveGroup = async () => {
        if (loadingAction) return;
        if (isOwner) {
            showToast('As Group Owner, you must transfer ownership before leaving.', 'error');
            return;
        }
        try {
            setLoadingAction(true);
            await groupService.leaveGroup(realtimeGroup.id, user.uid);
            showToast('You left the group workspace.', 'info');
            onClose();
        } catch (err) {
            showToast(err.message || 'Failed to leave group.', 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleConfirmDeleteGroup = async () => {
        if (loadingAction) return;
        try {
            setLoadingAction(true);
            await groupService.deleteGroup(realtimeGroup.id);
            showToast('Group workspace permanently deleted.', 'info');
            setShowDeleteConfirm(false);
            onClose();
        } catch (err) {
            showToast(err.message || 'Failed to delete group.', 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-full sm:h-auto sm:max-h-[90vh] max-w-md bg-[var(--bg-surface)] border-0 sm:border border-[var(--border-color)] rounded-none sm:rounded-3xl p-5 shadow-2xl flex flex-col overflow-hidden relative transition-colors duration-300"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] shrink-0">
                            <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">Group Workspace Details</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-full transition-all cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 scrollbar-thin">
                            {showDeleteConfirm ? (
                                <div className="p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-2xl space-y-3 text-center animate-auth-card">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-danger)]/20 text-[var(--color-danger)] flex items-center justify-center mx-auto">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Permanently Delete Workspace?</h4>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        This action cannot be undone. All group metadata and settings will be permanently erased.
                                    </p>
                                    <div className="flex items-center space-x-2 pt-1">
                                        <button
                                            type="button"
                                            disabled={loadingAction}
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="flex-1 py-2 bg-[var(--bg-surface-hover)] hover:opacity-90 text-[var(--text-primary)] rounded-xl text-xs font-bold border border-[var(--border-color)] transition-all cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            disabled={loadingAction}
                                            onClick={handleConfirmDeleteGroup}
                                            className="flex-1 py-2 bg-[var(--color-danger)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                                        >
                                            {loadingAction ? 'Deleting...' : 'Confirm Delete'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Profile Overview Card */}
                                    <div className="flex flex-col items-center text-center space-y-2">
                                        <img
                                            src={realtimeGroup.avatar}
                                            alt={realtimeGroup.name}
                                            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[var(--color-primary)]/30 shadow-lg"
                                        />

                                        {editing ? (
                                            <div className="w-full space-y-2 pt-2">
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-3 py-1.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                                                />
                                                <textarea
                                                    rows="2"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className="w-full px-3 py-1.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                                                />
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditing(false)}
                                                        className="px-3 py-1 bg-[var(--bg-surface-hover)] text-xs font-semibold rounded-lg text-[var(--text-secondary)] border border-[var(--border-color)] cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={loadingAction}
                                                        onClick={handleSaveMetadata}
                                                        className="px-3 py-1 bg-[var(--color-primary)] text-xs font-semibold rounded-lg text-white cursor-pointer"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-center space-x-1.5">
                                                    <h3 className="text-base font-bold text-[var(--text-primary)]">{realtimeGroup.name}</h3>
                                                    {isAdmin && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditing(true)}
                                                            className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] p-1 cursor-pointer transition-colors"
                                                            title="Edit Details"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 210.3 3 3.5 17.768 3.696z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[var(--text-secondary)] max-w-xs">{realtimeGroup.description || 'No description provided.'}</p>
                                                <div className="flex items-center justify-center space-x-2 pt-1">
                                                    <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full border border-[var(--color-primary)]/20">
                                                        {realtimeGroup.memberCount || memberList.length} Members
                                                    </span>
                                                    {formattedCreatedDate && (
                                                        <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                                                            Created {formattedCreatedDate}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Admin Action Bar (Invite Friends) */}
                                    {isAdmin && (
                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsInviteModalOpen(true)}
                                                className="w-full py-2 px-3 bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30 text-[var(--color-primary)] border border-[var(--color-primary)]/30 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                </svg>
                                                <span>Invite Friends to Group</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Members Section (LIVE PRESENCE SYNC) */}
                                    <div className="pt-2 border-t border-[var(--border-color)]">
                                        <span className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                            Members List ({memberList.length})
                                        </span>

                                        <div className="space-y-2">
                                            {memberList.length === 0 ? (
                                                <div className="py-4 text-center text-xs text-[var(--text-secondary)]">No members found.</div>
                                            ) : (
                                                memberList.map((member) => (
                                                    <GroupMemberItem
                                                        key={member.uid || member.id}
                                                        member={member}
                                                        realtimeGroup={realtimeGroup}
                                                        currentUserUid={user?.uid}
                                                        friends={friends}
                                                        isAdmin={isAdmin}
                                                        isOwner={isOwner}
                                                        onRoleChange={handleRoleChange}
                                                        onRemove={handleRemoveMember}
                                                        onTransfer={handleTransferOwnership}
                                                        onSelectProfile={setSelectedMemberProfile}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="pt-3 border-t border-[var(--border-color)] flex flex-col space-y-2">
                                        {!isOwner && (
                                            <button
                                                type="button"
                                                disabled={loadingAction}
                                                onClick={handleLeaveGroup}
                                                className="w-full py-2 px-3 bg-[var(--color-danger)]/10 hover:bg-[var(--color-danger)]/20 text-[var(--color-danger)] border border-[var(--color-danger)]/20 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                            >
                                                {loadingAction ? 'Processing...' : 'Leave Group Workspace'}
                                            </button>
                                        )}

                                        {isOwner && (
                                            <button
                                                type="button"
                                                disabled={loadingAction}
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="w-full py-2 px-3 bg-[var(--color-danger)] hover:opacity-90 text-white rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md disabled:opacity-50"
                                            >
                                                Delete Group Workspace
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>

            {isInviteModalOpen && (
                <InviteMembersModal
                    group={realtimeGroup}
                    isOpen={isInviteModalOpen}
                    onClose={() => setIsInviteModalOpen(false)}
                />
            )}

            {selectedMemberProfile && (
                <ProfilePreviewModal
                    targetUser={selectedMemberProfile}
                    onClose={() => setSelectedMemberProfile(null)}
                />
            )}
        </>
    );
});

GroupProfileModal.displayName = 'GroupProfileModal';
export default GroupProfileModal;