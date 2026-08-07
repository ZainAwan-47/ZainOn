// React
import React, { useState, memo } from 'react';

// Components
import GroupCard from './GroupCard';
import CreateGroupModal from './CreateGroupModal';
import GroupProfileModal from './GroupProfileModal';

export const GroupsTab = memo(({ groups = [], loading = false, activeGroupId, onSelectGroup }) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedGroupProfile, setSelectedGroupProfile] = useState(null);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[var(--text-secondary)] font-medium">Loading groups...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2 p-1 select-none">
            {/* Modals */}
            <CreateGroupModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onGroupCreated={(groupId) => {
                    if (onSelectGroup) onSelectGroup(groupId);
                }}
            />

            {selectedGroupProfile && (
                <GroupProfileModal
                    group={selectedGroupProfile}
                    isOpen={Boolean(selectedGroupProfile)}
                    onClose={() => setSelectedGroupProfile(null)}
                />
            )}

            {/* Action Header */}
            <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Group Workspaces
                </span>
                <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="py-1 px-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center space-x-1 cursor-pointer"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New Group</span>
                </button>
            </div>

            {/* Empty State: No Groups */}
            {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">Create your first group.</span>
                    <p className="text-[11px] text-[var(--text-secondary)] max-w-[200px]">
                        Start a group workspace to collaborate with your friends.
                    </p>
                </div>
            ) : (
                <div className="space-y-1">
                    {groups.map((group) => (
                        <GroupCard
                            key={group.id}
                            group={group}
                            isActive={group.id === activeGroupId}
                            onClick={() => onSelectGroup && onSelectGroup(group.id)}
                            onViewProfile={(g) => setSelectedGroupProfile(g)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

GroupsTab.displayName = 'GroupsTab';
export default GroupsTab;