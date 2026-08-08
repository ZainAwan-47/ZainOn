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
import MessageSearchToolbar from './MessageSearchToolbar';
import DeleteMessageModal from './DeleteMessageModal';

export const ChatRoom = memo(({ conversation, onViewProfile, onCloseChat }) => {
    const { user } = useAuth();

    const isGroup = conversation?.type === 'group';
    const otherParticipant = conversation?.otherParticipant || {};

    const chatContainerRef = useRef(null);
    const prevMessagesLengthRef = useRef(0);
    const isNearBottomRef = useRef(true);
    const ackedDeliveredIdsRef = useRef(new Set());

    const [replyingTo, setReplyingTo] = useState(null);
    const [isGroupProfileOpen, setIsGroupProfileOpen] = useState(false);
    const [showScrollBadge, setShowScrollBadge] = useState(false);
    const [isFriend, setIsFriend] = useState(true);

    const [showInlineSearch, setShowInlineSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [matchingMessageIds, setMatchingMessageIds] = useState([]);
    const [searchIndex, setSearchIndex] = useState(0);

    const [editingMessageId, setEditingMessageId] = useState(null);

    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState([]);
    const [deleteModalState, setDeleteModalState] = useState({
        isOpen: false,
        message: null,
        canDeleteForEveryone: false,
        isBulk: false,
    });

    const [showLoading, setShowLoading] = useState(false);
    const [viewingSeenBy, setViewingSeenBy] = useState(null);
    const [viewingReactions, setViewingReactions] = useState(null);

    const { messages, loading } = useMessages(
        conversation?.id,
        isGroup ? undefined : otherParticipant.uid
    );

    const [displayMessages, setDisplayMessages] = useState([]);

    useEffect(() => {
        setDisplayMessages(messages);
    }, [messages]);

    useEffect(() => {
        let timer;
        if (loading) {
            timer = setTimeout(() => setShowLoading(true), 150);
        } else {
            setShowLoading(false);
        }
        return () => clearTimeout(timer);
    }, [loading]);

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

    useEffect(() => {
        if (!searchQuery.trim()) {
            setMatchingMessageIds([]);
            setSearchIndex(0);
            return;
        }
        const term = searchQuery.toLowerCase();
        const matched = displayMessages
            .filter((msg) => msg.text && msg.text.toLowerCase().includes(term) && !msg.isDeleted)
            .map((m) => m.id)
            .reverse();

        setMatchingMessageIds(matched);
        setSearchIndex(0);
        if (matched.length > 0) {
            scrollToMessageId(matched[0]);
        }
    }, [searchQuery, displayMessages]);

    const scrollToMessageId = (msgId) => {
        const el = document.getElementById(`msg-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bg-[var(--color-primary)]/15', 'transition-colors', 'duration-700', 'rounded-2xl');
            setTimeout(() => {
                el.classList.remove('bg-[var(--color-primary)]/15');
            }, 1500);
        }
    };

    const handleNextMatch = () => {
        if (matchingMessageIds.length === 0) return;
        const nextIdx = (searchIndex + 1) % matchingMessageIds.length;
        setSearchIndex(nextIdx);
        scrollToMessageId(matchingMessageIds[nextIdx]);
    };

    const handlePrevMatch = () => {
        if (matchingMessageIds.length === 0) return;
        const prevIdx = (searchIndex - 1 + matchingMessageIds.length) % matchingMessageIds.length;
        setSearchIndex(prevIdx);
        scrollToMessageId(matchingMessageIds[prevIdx]);
    };

    // Clean, precise container scrolling without overscroll distortion
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

    // Re-align scroll precisely when viewport/layout size changes (e.g. desktop <-> mobile toggle)
    useEffect(() => {
        const handleResize = () => {
            if (isNearBottomRef.current) {
                scrollToBottom(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [scrollToBottom]);

    const processAcknowledgements = useCallback(() => {
        if (!conversation?.id || !user?.uid || displayMessages.length === 0) return;

        const readReceiptsEnabled = user?.privacy?.readReceipts ?? true;

        const unackedDelivered = displayMessages.filter(
            (m) =>
                m.senderId !== user.uid &&
                m.deliveryStatus === 'sent' &&
                !ackedDeliveredIdsRef.current.has(m.id)
        );
        if (unackedDelivered.length > 0) {
            unackedDelivered.forEach((m) => ackedDeliveredIdsRef.current.add(m.id));
            messageService.markAsDelivered(conversation.id, user.uid, unackedDelivered, isGroup);
        }

        const unconsumed = displayMessages.filter(
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
    }, [conversation?.id, user?.uid, displayMessages, isGroup, user?.privacy?.readReceipts]);

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
    }, [displayMessages, processAcknowledgements]);

    useLayoutEffect(() => {
        if (!loading && displayMessages.length > 0 && prevMessagesLengthRef.current === 0) {
            scrollToBottom(true);
            isNearBottomRef.current = true;
        }
    }, [loading, displayMessages.length, scrollToBottom]);

    useLayoutEffect(() => {
        if (displayMessages.length > prevMessagesLengthRef.current && prevMessagesLengthRef.current !== 0) {
            const lastMsg = displayMessages[displayMessages.length - 1];
            const isOwnMsg = lastMsg?.senderId === user?.uid;

            if (isOwnMsg || isNearBottomRef.current) {
                requestAnimationFrame(() => scrollToBottom(false));
            } else {
                setShowScrollBadge(true);
            }
        }
        prevMessagesLengthRef.current = displayMessages.length;
    }, [displayMessages, user?.uid, scrollToBottom]);

    // Extract typing status map from conversation
    const typingMap = conversation?.typing || {};
    const otherUserUid = isGroup ? null : otherParticipant?.uid;
    const isOtherUserTyping = otherUserUid
        ? Boolean(typingMap[otherUserUid])
        : Object.entries(typingMap).some(([uid, val]) => uid !== user?.uid && val);

    // Smoothly adjust scroll position when typing indicator appears or disappears
    useEffect(() => {
        if (isNearBottomRef.current) {
            requestAnimationFrame(() => scrollToBottom(false));
        }
    }, [isOtherUserTyping, scrollToBottom]);

    const handleSendWithReply = useCallback(
        async (text, replyToMsg) => {
            try {
                await messageService.sendMessage(
                    conversation.id,
                    user.uid,
                    text,
                    isGroup ? null : otherParticipant.uid,
                    replyToMsg,
                    isFriend
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
                senderName: isGroup
                    ? conversation.participants?.[targetMsg.senderId]?.fullName || 'Member'
                    : null,
            });
        },
        [isGroup, conversation?.participants]
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

    const handleEditSubmit = async (messageId, newText) => {
        setEditingMessageId(null);
        setDisplayMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, text: newText, isEdited: true } : m))
        );
        try {
            await messageService.editMessage(conversation.id, messageId, user.uid, newText);
        } catch (error) {
            console.error('Failed to edit message:', error);
        }
    };

    const canDeleteMessageForEveryone = (msg) => {
        if (msg.senderId !== user?.uid || msg.deletedForEveryone) return false;
        const seenByOthers = (msg.seenBy || []).filter(id => id !== user.uid);
        if (seenByOthers.length === 0) return true;

        let earliestReadMillis = null;
        const seenAtMap = msg.seenAt || {};
        seenByOthers.forEach(uid => {
            const ts = seenAtMap[uid];
            const millis = ts?.toMillis ? ts.toMillis() : (ts ? new Date(ts).getTime() : null);
            if (millis && (!earliestReadMillis || millis < earliestReadMillis)) {
                earliestReadMillis = millis;
            }
        });

        if (!earliestReadMillis) {
            const createdAtMillis = msg.createdAt?.toMillis ? msg.createdAt.toMillis() : (msg.createdAt ? new Date(msg.createdAt).getTime() : null);
            earliestReadMillis = createdAtMillis;
        }

        if (!earliestReadMillis) return false;
        const diffMinutes = (Date.now() - earliestReadMillis) / (1000 * 60);
        return diffMinutes <= 3;
    };

    const handleOpenDeleteModalForSingle = (msg) => {
        setDeleteModalState({
            isOpen: true,
            message: msg,
            canDeleteForEveryone: canDeleteMessageForEveryone(msg),
            isBulk: false,
        });
    };

    const handleOpenDeleteModalForBulk = () => {
        if (selectedMessageIds.length === 0) return;
        const selectedMsgs = displayMessages.filter(m => selectedMessageIds.includes(m.id));
        const allOwn = selectedMsgs.every(m => m.senderId === user.uid);
        const canBulkEveryone = allOwn && selectedMsgs.every(m => canDeleteMessageForEveryone(m));

        setDeleteModalState({
            isOpen: true,
            message: null,
            canDeleteForEveryone: canBulkEveryone,
            isBulk: true,
        });
    };

    const handleExecuteDelete = async (deleteForEveryone) => {
        const currentModalState = { ...deleteModalState };
        setDeleteModalState({ isOpen: false, message: null, canDeleteForEveryone: false, isBulk: false });

        const idsToProcess = currentModalState.isBulk
            ? [...selectedMessageIds]
            : [currentModalState.message?.id].filter(Boolean);

        if (idsToProcess.length === 0) return;

        setDisplayMessages((prev) => {
            if (deleteForEveryone) {
                return prev.map(m => idsToProcess.includes(m.id) ? { ...m, isDeleted: true, text: 'This message was deleted', reactions: {} } : m);
            } else {
                return prev.filter(m => !idsToProcess.includes(m.id));
            }
        });

        if (currentModalState.isBulk) {
            setSelectedMessageIds([]);
            setIsMultiSelectMode(false);
        }

        try {
            if (currentModalState.isBulk) {
                await messageService.deleteMultipleMessages(
                    conversation.id,
                    idsToProcess,
                    user.uid,
                    deleteForEveryone
                );
            } else if (currentModalState.message) {
                await messageService.deleteMessage(
                    conversation.id,
                    currentModalState.message.id,
                    user.uid,
                    deleteForEveryone
                );
            }
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    };

    const handleToggleSelectMessage = (msgId) => {
        setSelectedMessageIds((prev) =>
            prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
        );
    };

    if (!conversation) return null;

    const myNonFriendCount = conversation.nonFriendMessageCounts?.[user?.uid] || 0;
    const isLimitReached = !isGroup && !isFriend && myNonFriendCount >= 5;

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

            <DeleteMessageModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ isOpen: false, message: null, canDeleteForEveryone: false, isBulk: false })}
                onDelete={handleExecuteDelete}
                canDeleteForEveryone={deleteModalState.canDeleteForEveryone}
            />

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
                onOpenSearch={() => setShowInlineSearch(true)}
                onEnableMultiSelect={() => {
                    setIsMultiSelectMode(true);
                    setSelectedMessageIds([]);
                }}
            />

            {showInlineSearch && (
                <MessageSearchToolbar
                    query={searchQuery}
                    setQuery={setSearchQuery}
                    currentIndex={searchIndex}
                    totalMatches={matchingMessageIds.length}
                    onPrev={handlePrevMatch}
                    onNext={handleNextMatch}
                    onClose={() => {
                        setShowInlineSearch(false);
                        setSearchQuery('');
                    }}
                />
            )}

            {isMultiSelectMode && (
                <div className="bg-[var(--bg-surface)] border-b border-[var(--border-color)] px-6 py-3 flex items-center justify-between shrink-0 shadow-md animate-in slide-in-from-top duration-200">
                    <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                            {selectedMessageIds.length} selected
                        </span>
                        <button
                            onClick={() => {
                                setIsMultiSelectMode(false);
                                setSelectedMessageIds([]);
                            }}
                            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>

                    <button
                        onClick={handleOpenDeleteModalForBulk}
                        disabled={selectedMessageIds.length === 0}
                        className="px-4 py-1.5 bg-[var(--color-danger)] text-white text-xs font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                    >
                        Delete Selected
                    </button>
                </div>
            )}

            <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 scrollbar-thin relative flex flex-col"
            >
                {loading ? (
                    showLoading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-3">
                            <div className="w-7 h-7 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-semibold text-[var(--text-secondary)]">Loading messages...</p>
                        </div>
                    ) : (
                        <div className="flex-1" />
                    )
                ) : displayMessages.length === 0 ? (
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
                    <div className="flex flex-col space-y-1 mt-auto">
                        {displayMessages.map((msg, index) => {
                            const prevMsg = displayMessages[index - 1];
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
                                    <div id={`msg-${msg.id}`}>
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
                                            onDelete={handleOpenDeleteModalForSingle}
                                            onEditSubmit={handleEditSubmit}
                                            isPinned={conversation.pinnedMessage?.id === msg.id}
                                            isMultiSelectMode={isMultiSelectMode}
                                            isSelected={selectedMessageIds.includes(msg.id)}
                                            onToggleSelect={handleToggleSelectMessage}
                                            onViewSeenBy={setViewingSeenBy}
                                            onViewReactions={setViewingReactions}
                                            searchQuery={searchQuery}
                                            onScrollToMessage={scrollToMessageId}
                                            isEditing={editingMessageId === msg.id}
                                            onStartEdit={setEditingMessageId}
                                            onCancelEdit={() => setEditingMessageId(null)}
                                            isAnyEditingActive={Boolean(editingMessageId)}
                                        />
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        {/* 3-dots wave typing indicator */}
                        {isOtherUserTyping && (
                            <div className="flex items-center space-x-2 mb-3 mt-1 select-none animate-in fade-in duration-200">
                                <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] px-4 py-2.5 rounded-2xl rounded-tl-xs shadow-sm flex items-center space-x-1.5">
                                    <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                    </div>
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
                    conversationId={conversation.id}
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