// React
import React, { useState, useMemo, memo } from 'react';

// Third Party Libraries
import { motion, AnimatePresence } from 'framer-motion';

// Services & Hooks
import { useFriends } from '../../hooks/useFriends';
import { groupService } from '../../services/groupService';
import { useToast } from '../../context/ToastContext';
import { GROUP_LIMITS } from '../../constants/groupConstants';
import { useGroups } from '../../hooks/useGroups';
import { useConversations } from '../../hooks/useConversations';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';

export const InviteMembersModal = memo(({ isOpen, group, onClose, onMembersAdded }) => {
    const { friends = [] } = useFriends() || {};
    const { showToast } = useToast();

    const { groups = [] } = useGroups() || {};
    const { conversations = [] } = useConversations() || {};

    const [selectedFriendIds, setSelectedFriendIds] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const realtimeGroup = useMemo(() => {
        if (!group) return null;
        return groups.find(g => g.id === group.id)
            || conversations.find(c => c.id === group.id)
            || group;
    }, [group, groups, conversations]);

    const getFriendUid = (friend) => friend?.uid || friend?.id || friend?.friendUid;

    const invitableFriends = useMemo(() => {
        if (!realtimeGroup?.members) return [];
        const currentMemberSet = new Set(realtimeGroup.members);
        return friends.filter((friend) => {
            const fUid = getFriendUid(friend);
            return fUid && !currentMemberSet.has(fUid);
        });
    }, [friends, realtimeGroup?.members]);

    const filteredFriends = useMemo(() => {
        if (!searchQuery.trim()) return invitableFriends;
        const q = searchQuery.toLowerCase();
        return invitableFriends.filter(
            (f) =>
                f.fullName?.toLowerCase().includes(q) ||
                f.username?.toLowerCase().includes(q)
        );
    }, [invitableFriends, searchQuery]);

    const toggleFriendSelection = (friend) => {
        const friendUid = getFriendUid(friend);
        if (!friendUid) return;

        setSelectedFriendIds((prev) => {
            const next = new Set(prev);
            if (next.has(friendUid)) {
                next.delete(friendUid);
            } else {
                const projectedTotal = (realtimeGroup?.members?.length || 0) + next.size + 1;
                if (projectedTotal > GROUP_LIMITS.MAX_MEMBERS) {
                    showToast(`Cannot exceed maximum group limit (${GROUP_LIMITS.MAX_MEMBERS} members).`, 'error');
                    return prev;
                }
                next.add(friendUid);
            }
            return next;
        });
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (selectedFriendIds.size === 0) {
            showToast('Select at least one friend to invite.', 'error');
            return;
        }

        try {
            setSubmitting(true);
            const selectedFriendsList = friends.filter((f) => {
                const uid = getFriendUid(f);
                return uid && selectedFriendIds.has(uid);
            });

            await groupService.addMember(realtimeGroup.id, selectedFriendsList);
            showToast(`Invited ${selectedFriendsList.length} new member(s) to the group.`, 'info');

            setSelectedFriendIds(new Set());
            onClose();
            if (onMembersAdded) onMembersAdded();
        } catch (err) {
            console.error('[InviteMembersModal]:', err);
            showToast(err.message || 'Failed to add members.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !realtimeGroup) return null;

    return (
        <AnimatePresence>
            <div
                // EXACT FIX 1: Changed 'p-0 sm:p-4' to 'p-3 sm:p-4'. 
                // This ensures that even on mobile, there is a small margin around the modal.
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    onClick={(e) => e.stopPropagation()}
                    // EXACT FIX 2: 
                    // - Removed 'h-full sm:h-auto', made it 'h-auto max-h-[90%]' globally.
                    // - Removed 'rounded-none', made it 'rounded-2xl sm:rounded-3xl' globally.
                    // - Removed 'border-0', made it always have a border.
                    className="w-full h-auto max-h-[90%] max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col overflow-hidden transition-colors duration-300"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] shrink-0">
                        <div>
                            <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">Invite Friends</h2>
                            <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-[260px]">
                                Add accepted friends to <span className="text-[var(--color-primary)] font-semibold">{realtimeGroup.name}</span>
                            </p>
                        </div>
                        <button type="button" onClick={onClose} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-full transition-all cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body Content */}
                    <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1 scrollbar-thin">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search friends by name or @username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-2 pl-9 pr-8 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            />
                            <svg className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Available Friends</span>
                            <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full border border-[var(--color-primary)]/20">
                                {selectedFriendIds.size} Selected
                            </span>
                        </div>

                        <div className="space-y-1.5 min-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                            {invitableFriends.length === 0 ? (
                                <div className="py-12 px-4 text-center space-y-1 select-none">
                                    <span className="text-xs font-bold text-[var(--text-primary)] block">All Friends Are Members</span>
                                    <p className="text-[11px] text-[var(--text-secondary)] max-w-[220px] mx-auto">
                                        Every friend on your accepted friends list is already in this group.
                                    </p>
                                </div>
                            ) : filteredFriends.length === 0 ? (
                                <div className="py-12 px-4 text-center space-y-1 select-none">
                                    <span className="text-xs font-bold text-[var(--text-primary)] block">No Friends Match Search</span>
                                    <p className="text-[11px] text-[var(--text-secondary)]">Try searching with a different name or username.</p>
                                </div>
                            ) : (
                                filteredFriends.map((friend) => {
                                    const friendUid = getFriendUid(friend);
                                    const isSelected = selectedFriendIds.has(friendUid);
                                    return (
                                        <div
                                            key={friendUid}
                                            onClick={() => toggleFriendSelection(friend)}
                                            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/40 text-[var(--text-primary)]' : 'bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-surface-hover)] border-transparent text-[var(--text-secondary)]'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3 min-w-0">
                                                <Avatar src={friend.photoURL} name={friend.fullName || 'User'} size="md" isOnline={friend.isOnline} />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">{friend.fullName || 'User'}</span>
                                                    <span className="text-[10px] text-[var(--color-primary)] truncate">@{friend.username || 'username'}</span>
                                                    <div className="mt-0.5">
                                                        <PresenceIndicator isOnline={friend.isOnline} lastSeen={friend.lastSeen} size="sm" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' : 'border-[var(--border-color)] bg-[var(--bg-main)]'}`}>
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

                    <div className="pt-3 border-t border-[var(--border-color)] flex items-center space-x-2 shrink-0">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 px-3 bg-[var(--bg-surface-hover)] hover:opacity-90 text-[var(--text-primary)] rounded-xl font-bold text-xs border border-[var(--border-color)] transition-all active:scale-95 cursor-pointer">
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={selectedFriendIds.size === 0 || submitting}
                            onClick={handleInvite}
                            className="flex-1 py-2.5 px-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-1"
                        >
                            <span>{submitting ? 'Adding...' : 'Add Selected'}</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
});

InviteMembersModal.displayName = 'InviteMembersModal';
export default InviteMembersModal;