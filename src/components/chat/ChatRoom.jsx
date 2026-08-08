// React
import React, {
    useRef,
    useEffect,
    useLayoutEffect,
    useState,
    useCallback,
    memo,
} from 'react';

// Third Party
import { motion, AnimatePresence } from 'framer-motion';

// Hooks & Services
import { useAuth } from '../../hooks/useAuth';
import { useMessages } from '../../hooks/useMessages';
import { messageService } from '../../services/messageService';
import { friendService } from '../../services/friendService';
import {
    getDateSeparatorLabel,
    shouldShowDateSeparator,
} from '../../utils/dateFormatter';

// Components
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import GroupProfileModal from '../groups/GroupProfileModal';
import SeenByModal from './SeenByModal';
import ReactionDetailsModal from './ReactionDetailsModal';

export const ChatRoom = memo(({ conversation, onViewProfile, onCloseChat }) => {
    const { user } = useAuth();

    const isGroup = conversation?.type === 'group';
    const otherParticipant = conversation?.otherParticipant || {};

    // Refs
    const chatContainerRef = useRef(null);
    const prevMessagesLengthRef = useRef(0);
    const isNearBottomRef = useRef(true);
    const ackedDeliveredIdsRef = useRef(new Set());

    const [replyingTo, setReplyingTo] = useState(null);
    const [isGroupProfileOpen, setIsGroupProfileOpen] = useState(false);
    const [showScrollBadge, setShowScrollBadge] = useState(false);
    const [isFriend, setIsFriend] = useState(true);

    // UI Debounce State for Loading Spinner
    const [showLoading, setShowLoading] = useState(false);

    // Modal States
    const [viewingSeenBy, setViewingSeenBy] = useState(null);
    const [viewingReactions, setViewingReactions] = useState(null);

    const { messages, loading } = useMessages(
        conversation?.id,
        isGroup ? undefined : otherParticipant.uid
    );

    // Debounce the loading indicator by 150ms to prevent cache-flicker
    useEffect(() => {
        let timer;
        if (loading) {
            timer = setTimeout(() => setShowLoading(true), 150);
        } else {
            setShowLoading(false);
        }
        return () => clearTimeout(timer);
    }, [loading]);

    // Check Friendship Status for 5-Message Limit
    useEffect(() => {
        if (isGroup || !user?.uid || !otherParticipant?.uid) return;
        const unsub = friendService.subscribeToFriendshipStatus(
            user.uid,
            otherParticipant.uid,
            (status) => {
                setIsFriend(status === 'FRIENDS');
            }
        );
        return () => unsub();
    }, [user?.uid, otherParticipant?.uid, isGroup]);

    const scrollToBottom = useCallback((instant = false) => {
        if (!chatContainerRef.current) return;
        const container = chatContainerRef.current;
        container.scrollTo({
            top: container.scrollHeight,
            behavior: instant ? 'auto' : 'smooth',
        });
        isNearBottomRef.current = true;
        setShowScrollBadge(false);
    }, []);

    const processAcknowledgements = useCallback(() => {
        if (!conversation?.id || !user?.uid || messages.length === 0) return;

        const readReceiptsEnabled = user?.privacy?.readReceipts ?? true;

        const unackedDelivered = messages.filter(
            (m) =>
                m.senderId !== user.uid &&
                m.deliveryStatus === 'sent' &&
                !ackedDeliveredIdsRef.current.has(m.id)
        );
        if (unackedDelivered.length > 0) {
            unackedDelivered.forEach((m) => ackedDeliveredIdsRef.current.add(m.id));
            messageService.markAsDelivered(conversation.id, user.uid, unackedDelivered, isGroup);
        }

        const unconsumed = messages.filter(
            (m) =>
                m.senderId !== user.uid &&
                (!m.consumedBy || !m.consumedBy.includes(user.uid))
        );

        if (unconsumed.length > 0) {
            if (readReceiptsEnabled) {
                messageService.markAsSeen(conversation.id, user.uid, unconsumed, isGroup);
            } else {
                messageService.markAsConsumedOnly(conversation.id, user.uid, unconsumed);
            }
        }
    }, [conversation?.id, user?.uid, messages, isGroup, user?.privacy?.readReceipts]);

    const handleScroll = useCallback(() => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;

        const autoScrollEnabled = user?.chatPrefs?.autoScroll ?? true;
        const threshold = autoScrollEnabled ? 250 : 150;

        const isNearBottom = scrollHeight - scrollTop - clientHeight <= threshold;

        isNearBottomRef.current = isNearBottom;

        if (isNearBottom) {
            if (showScrollBadge) setShowScrollBadge(false);
            processAcknowledgements();
        }
    }, [showScrollBadge, processAcknowledgements, user?.chatPrefs?.autoScroll]);

    useEffect(() => {
        if (isNearBottomRef.current) {
            processAcknowledgements();
        }
    }, [messages, processAcknowledgements]);

    // INITIAL MOUNT INSTANT SCROLL
    useLayoutEffect(() => {
        if (!loading && messages.length > 0 && prevMessagesLengthRef.current === 0) {
            // Force synchronous direct DOM manipulation for instant paint
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
            isNearBottomRef.current = true;
        }
    }, [loading, messages.length]);

    // SUBSEQUENT NEW MESSAGE SCROLL LOGIC
    useLayoutEffect(() => {
        if (messages.length > prevMessagesLengthRef.current && prevMessagesLengthRef.current !== 0) {
            const lastMsg = messages[messages.length - 1];
            const isOwnMsg = lastMsg?.senderId === user?.uid;

            if (isOwnMsg || isNearBottomRef.current) {
                requestAnimationFrame(() => scrollToBottom(false));
            } else {
                setShowScrollBadge(true);
            }
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages, user?.uid, scrollToBottom]);

    const handleSendWithReply = useCallback(
        async (text, replyToMsg) => {
            try {
                await messageService.sendMessage(
                    conversation.id,
                    user.uid,
                    text,
                    isGroup ? null : otherParticipant.uid,
                    replyToMsg,
                    isFriend // Pass friendship status directly to the backend function
                );
                setReplyingTo(null);
                scrollToBottom(false);
            } catch (error) {
                console.error("Failed to send message:", error);
            }
        },
        [conversation?.id, user?.uid, isGroup, otherParticipant.uid, isFriend, scrollToBottom]
    );

    const handleCancelReply = useCallback(() => {
        setReplyingTo(null);
    }, []);

    const handleToggleReaction = useCallback(
        (messageId, emoji) => {
            if (!conversation?.id || !user?.uid) return;
            messageService.toggleReaction(conversation.id, messageId, emoji, user.uid);
        },
        [conversation?.id, user?.uid]
    );

    const handleTogglePin = useCallback(
        (message) => {
            if (!conversation?.id) return;
            messageService.togglePinMessage(
                conversation.id,
                message,
                conversation.pinnedMessage?.id
            );
        },
        [conversation?.id, conversation?.pinnedMessage?.id]
    );

    const handleToggleStar = useCallback(
        (messageId, currentStarredMap) => {
            if (!conversation?.id || !user?.uid) return;
            messageService.toggleStarMessage(
                conversation.id,
                messageId,
                user.uid,
                currentStarredMap
            );
        },
        [conversation?.id, user?.uid]
    );

    const handleUnpinHeader = useCallback(() => {
        if (conversation?.pinnedMessage && conversation?.id) {
            messageService.togglePinMessage(
                conversation.id,
                { id: conversation.pinnedMessage.id },
                conversation.pinnedMessage.id
            );
        }
    }, [conversation?.id, conversation?.pinnedMessage]);

    const handleSetReply = useCallback(
        (targetMsg) => {
            setReplyingTo({
                id: targetMsg.id,
                text: targetMsg.text,
                senderId: targetMsg.senderId,
                senderName:
                    targetMsg.senderId === user?.uid
                        ? 'You'
                        : isGroup
                            ? conversation.participants?.[targetMsg.senderId]?.fullName || 'Member'
                            : otherParticipant.fullName,
            });
        },
        [user?.uid, isGroup, conversation?.participants, otherParticipant.fullName]
    );

    const handleProfileViewTrigger = useCallback(
        (target) => {
            if (isGroup) {
                setIsGroupProfileOpen(true);
            } else if (onViewProfile) {
                onViewProfile(target);
            }
        },
        [isGroup, onViewProfile]
    );

    if (!conversation) return null;

    const myNonFriendCount = conversation.nonFriendMessageCounts?.[user?.uid] || 0;
    const isLimitReached = !isGroup && !isFriend && myNonFriendCount >= 5;

    // Explicitly build participant map for Direct Messages so Modals map properly
    const activeParticipantsMap = isGroup
        ? conversation.participants
        : { [user.uid]: user, [otherParticipant.uid]: otherParticipant };

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-[var(--bg-main)] transition-colors duration-300 overflow-hidden relative">

            {isGroup && isGroupProfileOpen && (
                <GroupProfileModal
                    group={conversation}
                    isOpen={isGroupProfileOpen}
                    onClose={() => setIsGroupProfileOpen(false)}
                />
            )}

            <AnimatePresence>
                {viewingSeenBy && (
                    <SeenByModal
                        message={viewingSeenBy}
                        participants={activeParticipantsMap}
                        onClose={() => setViewingSeenBy(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {viewingReactions && (
                    <ReactionDetailsModal
                        message={viewingReactions}
                        participants={activeParticipantsMap}
                        onClose={() => setViewingReactions(null)}
                    />
                )}
            </AnimatePresence>

            <ChatHeader
                conversation={conversation}
                participant={otherParticipant}
                pinnedMessage={conversation.pinnedMessage}
                onUnpin={handleUnpinHeader}
                onViewProfile={handleProfileViewTrigger}
                onCloseChat={onCloseChat}
            />

            <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 scrollbar-thin relative"
            >
                {loading ? (
                    showLoading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-3">
                            <div className="w-7 h-7 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-semibold text-[var(--text-secondary)]">Loading messages...</p>
                        </div>
                    ) : (
                        <div className="flex-1" /> // Invisible spacer for the 150ms window
                    )
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 select-none">
                        {isGroup ? (
                            <>
                                <div className="w-14 h-14 rounded-3xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] shadow-inner mb-1">
                                    <span className="text-2xl font-black">#</span>
                                </div>
                                <span className="text-xs font-bold text-[var(--text-primary)]">
                                    Welcome to {conversation.name || 'Group Workspace'}!
                                </span>
                                <p className="text-[11px] text-[var(--text-secondary)] leading-normal max-w-[260px]">
                                    This is the beginning of the{' '}
                                    <span className="text-[var(--color-primary)] font-semibold">{conversation.name}</span> group space.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] mb-1 shadow-sm">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold text-[var(--text-primary)]">No Messages Yet</span>
                                <p className="text-[11px] text-[var(--text-secondary)] leading-normal max-w-[220px]">
                                    Send a message to start chatting with{' '}
                                    <span className="text-[var(--text-primary)] font-semibold">
                                        {otherParticipant.fullName || 'your friend'}
                                    </span>.
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="flex flex-col space-y-1"
                    >
                        {messages.map((msg, index) => {
                            const prevMsg = messages[index - 1];
                            const showSeparator = shouldShowDateSeparator(msg, prevMsg);
                            const dateLabel = getDateSeparatorLabel(msg.createdAt);

                            return (
                                <React.Fragment key={msg.id}>
                                    {showSeparator && dateLabel && (
                                        <div className="my-3 flex items-center justify-center select-none">
                                            <span className="px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider shadow-sm">
                                                {dateLabel}
                                            </span>
                                        </div>
                                    )}
                                    <MessageBubble
                                        message={msg}
                                        isOwn={msg.senderId === user?.uid}
                                        isGroup={isGroup}
                                        recipientUid={isGroup ? '' : otherParticipant.uid}
                                        currentUid={user?.uid}
                                        onReact={handleToggleReaction}
                                        onReply={handleSetReply}
                                        onPin={handleTogglePin}
                                        onStar={handleToggleStar}
                                        isPinned={conversation.pinnedMessage?.id === msg.id}
                                        onViewSeenBy={setViewingSeenBy}
                                        onViewReactions={setViewingReactions}
                                    />
                                </React.Fragment>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            {showScrollBadge && (
                <button
                    onClick={() => scrollToBottom(false)}
                    className="absolute bottom-[88px] right-6 w-10 h-10 bg-[var(--color-primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-all z-20 animate-bounce cursor-pointer"
                    title="New messages below"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </button>
            )}

            {isLimitReached ? (
                <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex flex-col items-center justify-center space-y-1.5 text-center select-none">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-warning)]/10 flex items-center justify-center text-[var(--color-warning)] mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">Limit Reached</span>
                    <p className="text-[10px] text-[var(--text-secondary)] max-w-xs leading-relaxed">
                        You can only send 5 messages to non-friends. Send them a friend request to continue this conversation.
                    </p>
                </div>
            ) : (
                <MessageInput
                    onSend={handleSendWithReply}
                    replyingTo={replyingTo}
                    onCancelReply={handleCancelReply}
                    disabled={false}
                />
            )}
        </div>
    );
});

ChatRoom.displayName = 'ChatRoom';
export default ChatRoom;