// React
import React, { useState, memo } from 'react';

// Third Party Libraries
import { motion, AnimatePresence } from 'framer-motion';

// Services & Hooks
import { useAuth } from '../../hooks/useAuth';
import { groupService } from '../../services/groupService';
import { useToast } from '../../context/ToastContext';
import { GROUP_ROLES } from '../../constants/groupConstants';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';
import InviteMembersModal from './InviteMembersModal';

export const GroupProfileModal = memo(({ group, isOpen, onClose }) => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [loadingAction, setLoadingAction] = useState(false);
    const [editing, setEditing] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [name, setName] = useState(group?.name || '');
    const [description, setDescription] = useState(group?.description || '');

    if (!isOpen || !group) return null;

    const currentRole = group.roles?.[user?.uid] || GROUP_ROLES.MEMBER;
    const isOwner = currentRole === GROUP_ROLES.OWNER;
    const isAdmin = isOwner || currentRole === GROUP_ROLES.ADMIN;

    const memberList = Object.values(group.participants || {});

    let formattedCreatedDate = '';
    if (group.createdAt?.toDate) {
        formattedCreatedDate = group.createdAt.toDate().toLocaleDateString([], {
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
            await groupService.updateGroup(group.id, { name, description });
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
                await groupService.promoteAdmin(group.id, targetUid);
                showToast('Promoted member to Admin.', 'info');
            } else {
                await groupService.demoteAdmin(group.id, targetUid);
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
            await groupService.transferOwnership(group.id, user.uid, targetUid);
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
            await groupService.removeMember(group.id, targetUid);
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
            await groupService.leaveGroup(group.id, user.uid);
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
            await groupService.deleteGroup(group.id);
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
                    className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-full sm:h-auto sm:max-h-[90vh] max-w-md bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-3xl p-5 shadow-2xl flex flex-col overflow-hidden relative"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                            <h2 className="text-base font-bold text-white tracking-tight">Group Workspace Details</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 scrollbar-thin">
                            {/* Delete Group Confirmation Overlay */}
                            {showDeleteConfirm ? (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-3 text-center animate-auth-card">
                                    <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-sm font-bold text-white">Permanently Delete Workspace?</h4>
                                    <p className="text-xs text-slate-300">
                                        This action cannot be undone. All group metadata and settings will be permanently erased.
                                    </p>
                                    <div className="flex items-center space-x-2 pt-1">
                                        <button
                                            type="button"
                                            disabled={loadingAction}
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            disabled={loadingAction}
                                            onClick={handleConfirmDeleteGroup}
                                            className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
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
                                            src={group.avatar}
                                            alt={group.name}
                                            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-lg"
                                        />

                                        {editing ? (
                                            <div className="w-full space-y-2 pt-2">
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white"
                                                />
                                                <textarea
                                                    rows="2"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white resize-none"
                                                />
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditing(false)}
                                                        className="px-3 py-1 bg-slate-800 text-xs font-semibold rounded-lg text-slate-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={loadingAction}
                                                        onClick={handleSaveMetadata}
                                                        className="px-3 py-1 bg-indigo-600 text-xs font-semibold rounded-lg text-white"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-center space-x-1.5">
                                                    <h3 className="text-base font-bold text-white">{group.name}</h3>
                                                    {isAdmin && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditing(true)}
                                                            className="text-slate-400 hover:text-indigo-400 p-1 cursor-pointer"
                                                            title="Edit Details"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 210.3 3 3.5 17.768 3.696z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 max-w-xs">{group.description || 'No description provided.'}</p>
                                                <div className="flex items-center justify-center space-x-2 pt-1">
                                                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                                        {group.memberCount || memberList.length} Members
                                                    </span>
                                                    {formattedCreatedDate && (
                                                        <span className="text-[10px] font-medium text-slate-500">
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
                                                className="w-full py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                </svg>
                                                <span>Invite Friends to Group</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Members Section */}
                                    <div className="pt-2 border-t border-slate-800">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            Members List ({memberList.length})
                                        </span>

                                        <div className="space-y-2">
                                            {memberList.length === 0 ? (
                                                <div className="py-4 text-center text-xs text-slate-500">No members found.</div>
                                            ) : (
                                                memberList.map((member) => {
                                                    const role = group.roles?.[member.uid] || GROUP_ROLES.MEMBER;
                                                    const isMemberOwner = role === GROUP_ROLES.OWNER;
                                                    const isMemberAdmin = role === GROUP_ROLES.ADMIN;
                                                    const isSelf = member.uid === user?.uid;

                                                    return (
                                                        <div
                                                            key={member.uid}
                                                            className="p-2.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center space-x-2.5 min-w-0">
                                                                <Avatar
                                                                    src={member.photoURL}
                                                                    name={member.fullName || 'User'}
                                                                    size="sm"
                                                                    isOnline={member.isOnline}
                                                                />
                                                                <div className="flex flex-col min-w-0">
                                                                    <div className="flex items-center space-x-1.5">
                                                                        <span className="text-xs font-bold text-white truncate">
                                                                            {member.fullName || 'User'}
                                                                        </span>
                                                                        {isSelf && <span className="text-[9px] text-indigo-400 font-bold">(You)</span>}
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-400 truncate">
                                                                        @{member.username || 'user'}
                                                                    </span>
                                                                    <div className="mt-0.5">
                                                                        <PresenceIndicator
                                                                            isOnline={member.isOnline}
                                                                            lastSeen={member.lastSeen}
                                                                            size="sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Role Badges & Context Actions */}
                                                            <div className="flex items-center space-x-2">
                                                                <span
                                                                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${isMemberOwner
                                                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                        : isMemberAdmin
                                                                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                                                            : 'bg-slate-800 text-slate-400'
                                                                        }`}
                                                                >
                                                                    {role}
                                                                </span>

                                                                {!isSelf && (
                                                                    <div className="flex items-center space-x-1">
                                                                        {/* Owner Role Actions */}
                                                                        {isOwner && (
                                                                            <>
                                                                                {!isMemberAdmin ? (
                                                                                    <button
                                                                                        type="button"
                                                                                        disabled={loadingAction}
                                                                                        onClick={() => handleRoleChange(member.uid, GROUP_ROLES.ADMIN)}
                                                                                        className="p-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer disabled:opacity-50"
                                                                                        title="Promote to Admin"
                                                                                    >
                                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
                                                                                        </svg>
                                                                                    </button>
                                                                                ) : (
                                                                                    <button
                                                                                        type="button"
                                                                                        disabled={loadingAction}
                                                                                        onClick={() => handleRoleChange(member.uid, GROUP_ROLES.MEMBER)}
                                                                                        className="p-1 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
                                                                                        title="Demote to Member"
                                                                                    >
                                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
                                                                                        </svg>
                                                                                    </button>
                                                                                )}

                                                                                <button
                                                                                    type="button"
                                                                                    disabled={loadingAction}
                                                                                    onClick={() => handleTransferOwnership(member.uid)}
                                                                                    className="p-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
                                                                                    title="Transfer Ownership"
                                                                                >
                                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                                                    </svg>
                                                                                </button>
                                                                            </>
                                                                        )}

                                                                        {/* Admin/Owner Member Removal Rights */}
                                                                        {isAdmin && !isMemberOwner && (
                                                                            <button
                                                                                type="button"
                                                                                disabled={loadingAction}
                                                                                onClick={() => handleRemoveMember(member.uid)}
                                                                                className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
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
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="pt-3 border-t border-slate-800 flex flex-col space-y-2">
                                        {!isOwner && (
                                            <button
                                                type="button"
                                                disabled={loadingAction}
                                                onClick={handleLeaveGroup}
                                                className="w-full py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                            >
                                                {loadingAction ? 'Processing...' : 'Leave Group Workspace'}
                                            </button>
                                        )}

                                        {isOwner && (
                                            <button
                                                type="button"
                                                disabled={loadingAction}
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md disabled:opacity-50"
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

            {/* --- FIX: Place Invite Modal BELOW AnimatePresence so it layers over top --- */}
            {isInviteModalOpen && (
                <InviteMembersModal
                    group={group}
                    isOpen={isInviteModalOpen}
                    onClose={() => setIsInviteModalOpen(false)}
                />
            )}
        </>
    );
});

GroupProfileModal.displayName = 'GroupProfileModal';
export default GroupProfileModal;