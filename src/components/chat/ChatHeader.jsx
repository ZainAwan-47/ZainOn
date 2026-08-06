// React
import React, { memo } from 'react';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';
import PinnedMessageBanner from './PinnedMessageBanner';

export const ChatHeader = memo(({ participant, pinnedMessage, onUnpin, onViewProfile, onCloseChat }) => {
    if (!participant) return null;

    return (
        <div className="flex flex-col shrink-0 select-none">
            <div className="h-[72px] px-5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between backdrop-blur-md">
                <div
                    onClick={() => onViewProfile && onViewProfile(participant)}
                    className="flex items-center space-x-3.5 cursor-pointer group"
                >
                    <Avatar
                        src={participant.photoURL}
                        name={participant.fullName || 'User'}
                        size="md"
                        isOnline={participant.isOnline}
                    />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {participant.fullName || 'User'}
                        </span>
                        <PresenceIndicator
                            isOnline={participant.isOnline}
                            lastSeen={participant.lastSeen}
                            size="sm"
                        />
                    </div>
                </div>

                {/* Action Bar & Close Chat Trigger */}
                <div className="flex items-center space-x-1">
                    {onCloseChat && (
                        <button
                            type="button"
                            onClick={onCloseChat}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all focus:outline-none active:scale-95"
                            title="Close Chat"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <PinnedMessageBanner pinnedMessage={pinnedMessage} onUnpin={onUnpin} />
        </div>
    );
});

ChatHeader.displayName = 'ChatHeader';
export default ChatHeader;