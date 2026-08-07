// React
import React, { memo } from 'react';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';
import PinnedMessageBanner from './PinnedMessageBanner';

export const ChatHeader = memo(({
    conversation,
    participant,
    pinnedMessage,
    onUnpin,
    onViewProfile,
    onCloseChat,
}) => {
    const isGroup = conversation?.type === 'group';
    const effectiveParticipant = participant || conversation?.otherParticipant || null;

    if (!isGroup && !effectiveParticipant) return null;

    return (
        <div className="flex flex-col shrink-0 select-none">
            <div className="h-[72px] px-5 bg-[var(--bg-surface)]/90 border-b border-[var(--border-color)] flex items-center justify-between backdrop-blur-md">

                {isGroup ? (
                    /* Group Workspace Header */
                    <div
                        onClick={() => onViewProfile && onViewProfile(conversation)}
                        className="flex items-center space-x-3.5 cursor-pointer group min-w-0"
                    >
                        <div className="relative shrink-0">
                            <img
                                src={conversation.avatar}
                                alt={conversation.name}
                                className="w-10 h-10 rounded-2xl object-cover ring-1 ring-[var(--border-color)]"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--color-primary)] border border-[var(--bg-surface)] rounded-full flex items-center justify-center text-[9px] text-white font-extrabold shadow-sm">
                                #
                            </div>
                        </div>

                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                                {conversation.name || 'Group Workspace'}
                            </span>
                            <span className="text-[10px] font-semibold text-[var(--color-primary)] opacity-90">
                                {conversation.memberCount || conversation.members?.length || 0} members
                            </span>
                        </div>
                    </div>
                ) : (
                    /* Direct Message Header */
                    <div
                        onClick={() => onViewProfile && onViewProfile(effectiveParticipant)}
                        className="flex items-center space-x-3.5 cursor-pointer group min-w-0"
                    >
                        <Avatar
                            src={effectiveParticipant.photoURL}
                            name={effectiveParticipant.fullName || 'User'}
                            size="md"
                            isOnline={effectiveParticipant.isOnline}
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                                {effectiveParticipant.fullName || 'User'}
                            </span>
                            <PresenceIndicator
                                isOnline={effectiveParticipant.isOnline}
                                lastSeen={effectiveParticipant.lastSeen}
                                size="sm"
                            />
                        </div>
                    </div>
                )}

                {/* Action Bar (Cross Button Rendered Here) */}
                <div className="flex items-center space-x-1 shrink-0">
                    {onCloseChat && (
                        <button
                            type="button"
                            onClick={onCloseChat}
                            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-xl transition-all focus:outline-none active:scale-95"
                            title="Close Chat"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {pinnedMessage && (
                <PinnedMessageBanner pinnedMessage={pinnedMessage} onUnpin={onUnpin} />
            )}
        </div>
    );
});

ChatHeader.displayName = 'ChatHeader';
export default ChatHeader;