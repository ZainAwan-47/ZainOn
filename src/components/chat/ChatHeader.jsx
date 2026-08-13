// React
import React, { useState, useEffect, useRef, memo, useContext } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

// Firebase
import { db } from '../../firebase/firestore';

// Hooks & Services
import { useAuth } from '../../hooks/useAuth';
import { friendService } from '../../services/friendService';
import { useToast } from '../../context/ToastContext';

// Context
import { CallContext } from '../../context/CallContext';

// Components
import Avatar from '../ui/Avatar';
import PresenceIndicator from '../ui/PresenceIndicator';
import PinnedMessageBanner from './PinnedMessageBanner';
import IconButton from '../ui/IconButton';

export const ChatHeader = memo(({
    conversation,
    participant,
    pinnedMessage,
    onUnpin,
    onViewProfile,
    onCloseChat,
    onOpenSearch,
    onEnableMultiSelect,
}) => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const callContext = useContext(CallContext) || {};
    const { startAudioCall, startVideoCall } = callContext;

    const isGroup = conversation?.type === 'group';

    const resolveInitialParticipant = () => {
        if (participant && participant.uid !== user?.uid) return participant;
        if (conversation?.otherParticipant && conversation.otherParticipant.uid !== user?.uid) {
            return conversation.otherParticipant;
        }
        if (conversation?.participants) {
            const ids = Array.isArray(conversation.participants)
                ? conversation.participants
                : Object.keys(conversation.participants);
            const otherId = ids.find(id => id !== user?.uid);
            if (otherId) {
                const details = typeof conversation.participants[otherId] === 'object'
                    ? conversation.participants[otherId]
                    : {};
                return { uid: otherId, ...details };
            }
        }
        return participant || conversation?.otherParticipant || null;
    };

    const [liveParticipant, setLiveParticipant] = useState(resolveInitialParticipant);
    const [isFriend, setIsFriend] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const resolved = resolveInitialParticipant();
        if (resolved) setLiveParticipant(resolved);
    }, [conversation, participant, user?.uid]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isGroup || !liveParticipant?.uid) return;
        const unsub = onSnapshot(doc(db, 'users', liveParticipant.uid), (docSnap) => {
            if (docSnap.exists()) {
                setLiveParticipant({ uid: docSnap.id, ...docSnap.data() });
            }
        });
        return () => unsub();
    }, [isGroup, liveParticipant?.uid]);

    useEffect(() => {
        if (isGroup || !user?.uid || !liveParticipant?.uid) return;
        const unsub = friendService.subscribeToFriendshipStatus(
            user.uid,
            liveParticipant.uid,
            (status) => {
                setIsFriend(status === 'FRIENDS');
            }
        );
        return () => unsub();
    }, [isGroup, user?.uid, liveParticipant?.uid]);

    if (!isGroup && !liveParticipant) return null;

    const onlineStatusEnabled = liveParticipant?.privacy?.onlineStatus !== false;
    const isOnlineEffective = onlineStatusEnabled ? liveParticipant?.isOnline : false;

    const lastSeenSetting = liveParticipant?.privacy?.lastSeen || 'everyone';
    let lastSeenEffective = liveParticipant?.lastSeen;
    if (lastSeenSetting === 'nobody') {
        lastSeenEffective = null;
    } else if (lastSeenSetting === 'friends' && !isFriend) {
        lastSeenEffective = null;
    }

    const handleAudioCall = () => {
        if (liveParticipant?.uid === user?.uid) {
            console.error('[CALL ERROR] Attempted to call yourself!');
            return;
        }
        // EXACT FIX: Restrict calls to friends only
        if (!isFriend) {
            showToast('Calls are only allowed with friends.', 'error');
            return;
        }
        if (startAudioCall) {
            startAudioCall(liveParticipant);
        }
    };

    const handleVideoCall = () => {
        if (liveParticipant?.uid === user?.uid) {
            console.error('[CALL ERROR] Attempted to call yourself!');
            return;
        }
        // EXACT FIX: Restrict calls to friends only
        if (!isFriend) {
            showToast('Calls are only allowed with friends.', 'error');
            return;
        }
        if (startVideoCall) {
            startVideoCall(liveParticipant);
        }
    };

    return (
        <div className="flex flex-col shrink-0 select-none relative z-40">
            <div className="h-[72px] px-5 bg-[var(--bg-surface)]/95 border-b border-[var(--border-color)] flex items-center justify-between backdrop-blur-md">

                {isGroup ? (
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
                    <div
                        onClick={() => onViewProfile && onViewProfile(liveParticipant)}
                        className="flex items-center space-x-3.5 cursor-pointer group min-w-0"
                    >
                        <Avatar
                            src={liveParticipant.photoURL}
                            name={liveParticipant.fullName || 'User'}
                            size="md"
                            isOnline={isOnlineEffective}
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                                {liveParticipant.fullName || 'User'}
                            </span>
                            <PresenceIndicator
                                isOnline={isOnlineEffective}
                                lastSeen={lastSeenEffective}
                                size="sm"
                                onlineStatusEnabled={onlineStatusEnabled}
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center space-x-1 shrink-0">

                    {!isGroup && (
                        <>
                            <IconButton onClick={handleAudioCall} title="Audio Call" size="sm">
                                <svg className="w-5 h-5 text-[var(--text-secondary)] hover:text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </IconButton>
                            <IconButton onClick={handleVideoCall} title="Video Call" size="sm">
                                <svg className="w-5 h-5 text-[var(--text-secondary)] hover:text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h8a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2z" />
                                </svg>
                            </IconButton>
                            <div className="h-5 w-px bg-[var(--border-color)] mx-1"></div>
                        </>
                    )}

                    <div className="relative z-50" ref={menuRef}>
                        <IconButton onClick={() => setIsMenuOpen((prev) => !prev)} title="More Options" size="sm">
                            <svg className="w-5 h-5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </IconButton>

                        {isMenuOpen && (
                            <div className="absolute right-0 top-12 w-48 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-1.5 z-[9999] flex flex-col space-y-1 animate-in fade-in duration-200">
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        if (onOpenSearch) onOpenSearch();
                                    }}
                                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer"
                                >
                                    <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span>Search Messages</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        if (onEnableMultiSelect) onEnableMultiSelect();
                                    }}
                                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer"
                                >
                                    <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <span>Select Messages</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {onCloseChat && (
                        <button
                            type="button"
                            onClick={onCloseChat}
                            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-xl transition-all focus:outline-none active:scale-95 cursor-pointer"
                            title="Close Chat Room"
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