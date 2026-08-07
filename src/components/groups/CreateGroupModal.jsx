// React
import React, { useState, useMemo, memo } from 'react';

// Third Party Libraries
import { motion, AnimatePresence } from 'framer-motion';

// Services & Hooks
import { useAuth } from '../../hooks/useAuth';
import { useFriends } from '../../hooks/useFriends';
import { groupService } from '../../services/groupService';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_GROUP_AVATARS, MIN_GROUP_SELECTED_FRIENDS, MAX_GROUP_MEMBERS } from '../../constants/groupConstants';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';

export const CreateGroupModal = memo(({ isOpen, onClose, onGroupCreated }) => {
    const { user } = useAuth();
    const { friends = [] } = useFriends() || {};
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_GROUP_AVATARS[0]);
    const [customAvatarUrl, setCustomAvatarUrl] = useState('');
    const [selectedFriendIds, setSelectedFriendIds] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const getFriendUid = (friend) => friend?.uid || friend?.id || friend?.friendUid;

    const filteredFriends = useMemo(() => {
        if (!searchQuery.trim()) return friends;
        const q = searchQuery.toLowerCase();
        return friends.filter(
            (f) =>
                f.fullName?.toLowerCase().includes(q) ||
                f.username?.toLowerCase().includes(q)
        );
    }, [friends, searchQuery]);

    const toggleFriendSelection = (friend) => {
        const friendUid = getFriendUid(friend);
        if (!friendUid) return;

        setSelectedFriendIds((prev) => {
            const next = new Set(prev);
            if (next.has(friendUid)) {
                next.delete(friendUid);
            } else {
                if (next.size + 1 >= MAX_GROUP_MEMBERS) {
                    showToast(`Cannot select more than ${MAX_GROUP_MEMBERS - 1} friends.`, 'error');
                    return prev;
                }
                next.add(friendUid);
            }
            return next;
        });
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (submitting) return;

        if (!name.trim()) {
            showToast('Please enter a group name.', 'error');
            return;
        }

        if (selectedFriendIds.size < MIN_GROUP_SELECTED_FRIENDS) {
            showToast(`Please select at least ${MIN_GROUP_SELECTED_FRIENDS} friends to create a group.`, 'error');
            return;
        }

        try {
            setSubmitting(true);

            const selectedFriendsList = friends.filter((f) => {
                const uid = getFriendUid(f);
                return uid && selectedFriendIds.has(uid);
            });

            const avatarToUse = customAvatarUrl.trim() || selectedAvatar;

            const groupId = await groupService.createGroup({
                name: name.trim(),
                description: description.trim(),
                avatar: avatarToUse,
                owner: user,
                selectedFriends: selectedFriendsList,
            });

            showToast('Group workspace created successfully!', 'info');

            setName('');
            setDescription('');
            setSelectedFriendIds(new Set());
            setCustomAvatarUrl('');

            onClose();

            if (onGroupCreated) {
                onGroupCreated(groupId);
            }
        } catch (err) {
            console.error('[CreateGroupModal.handleCreate failure]:', err);
            showToast(err.message || 'Failed to create group workspace.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const totalMembers = selectedFriendIds.size + 1;

    return (
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
                    className="w-full h-full sm:h-auto sm:max-h-[90vh] max-w-md bg-[var(--bg-surface)] border-0 sm:border border-[var(--border-color)] rounded-none sm:rounded-3xl p-5 shadow-2xl flex flex-col overflow-hidden transition-colors duration-300"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] shrink-0">
                        <div>
                            <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">Create Group Workspace</h2>
                            <p className="text-[11px] text-[var(--text-secondary)]">Collaborate with your workspace friends</p>
                        </div>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={onClose}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-full transition-all cursor-pointer disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleCreate} className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 scrollbar-thin">
                        {/* Group Name & Description */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                                    Group Name <span className="text-[var(--color-danger)]">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Frontend Engineering Team"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={submitting}
                                    className="w-full px-3.5 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="What is this group about?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={submitting}
                                    className="w-full px-3.5 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Avatar Selector */}
                        <div>
                            <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                                Group Avatar
                            </label>
                            <div className="flex items-center space-x-2 mb-2">
                                {DEFAULT_GROUP_AVATARS.map((url, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => {
                                            setSelectedAvatar(url);
                                            setCustomAvatarUrl('');
                                        }}
                                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer disabled:opacity-50 ${selectedAvatar === url && !customAvatarUrl
                                            ? 'border-[var(--color-primary)] scale-105 shadow-md shadow-[var(--color-primary)]/20'
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={url} alt="Avatar Preset" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                            <input
                                type="url"
                                placeholder="Or paste custom Image URL..."
                                value={customAvatarUrl}
                                onChange={(e) => setCustomAvatarUrl(e.target.value)}
                                disabled={submitting}
                                className="w-full px-3.5 py-1.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[11px] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50"
                            />
                        </div>

                        {/* Friend Selection Header & Filter */}
                        <div className="pt-2 border-t border-[var(--border-color)]">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Select Friends <span className="text-[var(--color-danger)]">*</span>
                                </label>
                                <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full border border-[var(--color-primary)]/20">
                                    {selectedFriendIds.size} Selected ({totalMembers} Members Total)
                                </span>
                            </div>

                            <input
                                type="text"
                                placeholder="Filter friends..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                disabled={submitting}
                                className="w-full py-1.5 px-3 mb-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50"
                            />

                            {/* Friends List Scroll Area */}
                            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                                {friends.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
                                        No accepted friends available to add.
                                    </div>
                                ) : filteredFriends.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
                                        No friends match your search.
                                    </div>
                                ) : (
                                    filteredFriends.map((friend) => {
                                        const friendUid = getFriendUid(friend);
                                        const isSelected = selectedFriendIds.has(friendUid);
                                        return (
                                            <div
                                                key={friendUid || friend.id}
                                                onClick={() => !submitting && toggleFriendSelection(friend)}
                                                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
                                                    ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/40 text-[var(--text-primary)]'
                                                    : 'bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-surface-hover)] border-transparent text-[var(--text-secondary)]'
                                                    } ${submitting ? 'opacity-50 pointer-events-none' : ''}`}
                                            >
                                                <div className="flex items-center space-x-2.5 min-w-0">
                                                    <Avatar
                                                        src={friend.photoURL}
                                                        name={friend.fullName || 'User'}
                                                        size="sm"
                                                        isOnline={friend.isOnline}
                                                    />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                                                            {friend.fullName || 'User'}
                                                        </span>
                                                        <span className="text-[10px] text-[var(--color-primary)] truncate">
                                                            @{friend.username || 'user'}
                                                        </span>
                                                        <div className="mt-0.5">
                                                            <PresenceIndicator
                                                                isOnline={friend.isOnline}
                                                                lastSeen={friend.lastSeen}
                                                                size="sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${isSelected
                                                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                                                        : 'border-[var(--border-color)] bg-[var(--bg-main)]'
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-[var(--border-color)] flex items-center space-x-2 shrink-0">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={onClose}
                                className="flex-1 py-2.5 px-3 bg-[var(--bg-surface-hover)] hover:opacity-90 text-[var(--text-primary)] rounded-xl font-bold text-xs border border-[var(--border-color)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-2.5 px-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
                            >
                                {submitting && (
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                                )}
                                <span>{submitting ? 'Creating...' : 'Create Group'}</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
});

CreateGroupModal.displayName = 'CreateGroupModal';
export default CreateGroupModal;