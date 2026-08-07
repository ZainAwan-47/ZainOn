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
import { AnimatePresence } from 'framer-motion';

// Hooks & Services
import { useAuth } from '../../hooks/useAuth';
import { useMessages } from '../../hooks/useMessages';
import { messageService } from '../../services/messageService';
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

    // Acknowledgement Deduplication Refs
    const ackedDeliveredIdsRef = useRef(new Set());
    const ackedSeenIdsRef = useRef(new Set());

    const [replyingTo, setReplyingTo] = useState(null);
    const [isGroupProfileOpen, setIsGroupProfileOpen] = useState(false);

    // Modal States
    const [viewingSeenBy, setViewingSeenBy] = useState(null);
    const [viewingReactions, setViewingReactions] = useState(null);

    const { messages, loading, sendMessage } = useMessages(
        conversation?.id,
        isGroup ? undefined : otherParticipant.uid
    );

    const handleScroll = useCallback(() => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
    }, []);

    const scrollToBottom = useCallback((instant = false) => {
        if (!chatContainerRef.current) return;
        const container = chatContainerRef.current;
        container.scrollTo({
            top: container.scrollHeight,
            behavior: instant ? 'auto' : 'smooth',
        });
    }, []);

    // REALTIME ACKNOWLEDGEMENTS (Now works for Groups too!)
    useEffect(() => {
        if (!conversation?.id || !user?.uid || messages.length === 0)
            return;

        // 1. Delivery Ack
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

        // 2. Seen Ack (Clears unread counter for groups automatically)
        const unackedSeen = messages.filter(
            (m) =>
                m.senderId !== user.uid &&
                (!m.seenBy || !m.seenBy.includes(user.uid)) &&
                !ackedSeenIdsRef.current.has(m.id)
        );
        if (unackedSeen.length > 0) {
            unackedSeen.forEach((m) => ackedSeenIdsRef.current.add(m.id));
            messageService.markAsSeen(conversation.id, user.uid, unackedSeen, isGroup);
        }
    }, [conversation?.id, user?.uid, messages, isGroup]);

    // Initial mount scroll
    useLayoutEffect(() => {
        if (!loading && messages.length > 0) {
            scrollToBottom(true);
        }
    }, [loading, conversation?.id, scrollToBottom]);

    // Synchronized smooth scroll on new message entry
    useLayoutEffect(() => {
        if (messages.length > prevMessagesLengthRef.current) {
            const lastMsg = messages[messages.length - 1];
            const isOwnMsg = lastMsg?.senderId === user?.uid;
            if (isOwnMsg || isNearBottomRef.current) {
                requestAnimationFrame(() => {
                    scrollToBottom(false);
                });
            }
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages, user?.uid, scrollToBottom]);

    const handleSendWithReply = useCallback(
        (text, replyToMsg) => {
            sendMessage(text, replyToMsg);
            setReplyingTo(null);
        },
        [sendMessage]
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

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-950 overflow-hidden relative">

            {/* Context Modals */}
            {isGroup && isGroupProfileOpen && (
                <GroupProfileModal
                    group={conversation}
                    isOpen={isGroupProfileOpen}
                    onClose={() => setIsGroupProfileOpen(false)}
                />
            )}

            {/* FIX: Let AnimatePresence manage the exit lifecycle */}
            <AnimatePresence>
                {viewingSeenBy && (
                    <SeenByModal
                        message={viewingSeenBy}
                        participants={conversation.participants}
                        onClose={() => setViewingSeenBy(null)}
                    />
                )}
            </AnimatePresence>

            {/* FIX: Let AnimatePresence manage the exit lifecycle */}
            <AnimatePresence>
                {viewingReactions && (
                    <ReactionDetailsModal
                        message={viewingReactions}
                        participants={conversation.participants}
                        onClose={() => setViewingReactions(null)}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <ChatHeader
                conversation={conversation}
                participant={otherParticipant}
                pinnedMessage={conversation.pinnedMessage}
                onUnpin={handleUnpinHeader}
                onViewProfile={handleProfileViewTrigger}
                onCloseChat={onCloseChat}
            />

            {/* Message Area Canvas */}
            <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin"
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-3">
                        <div className="w-7 h-7 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-semibold text-slate-400">Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 select-none">
                        {isGroup ? (
                            <>
                                <div className="w-14 h-14 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner mb-1">
                                    <span className="text-2xl font-black">#</span>
                                </div>
                                <span className="text-xs font-bold text-white">
                                    Welcome to {conversation.name || 'Group Workspace'}!
                                </span>
                                <p className="text-[11px] text-slate-400 leading-normal max-w-[260px]">
                                    This is the beginning of the{' '}
                                    <span className="text-indigo-400 font-semibold">{conversation.name}</span> group space.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-1">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold text-slate-300">No Messages Yet</span>
                                <p className="text-[11px] text-slate-400 leading-normal max-w-[220px]">
                                    Send a message to start chatting with{' '}
                                    <span className="text-white font-semibold">
                                        {otherParticipant.fullName || 'your friend'}
                                    </span>.
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const prevMsg = messages[index - 1];
                        const showSeparator = shouldShowDateSeparator(msg, prevMsg);
                        const dateLabel = getDateSeparatorLabel(msg.createdAt);

                        return (
                            <React.Fragment key={msg.id}>
                                {showSeparator && dateLabel && (
                                    <div className="my-3 flex items-center justify-center select-none">
                                        <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider shadow-sm">
                                            {dateLabel}
                                        </span>
                                    </div>
                                )}
                                <MessageBubble
                                    message={msg}
                                    isOwn={msg.senderId === user?.uid}
                                    isGroup={isGroup}
                                    recipientIsOnline={isGroup ? false : otherParticipant.isOnline}
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
                    })
                )}
            </div>

            <MessageInput
                onSend={handleSendWithReply}
                replyingTo={replyingTo}
                onCancelReply={handleCancelReply}
                disabled={false}
            />
        </div>
    );
});

ChatRoom.displayName = 'ChatRoom';
export default ChatRoom;