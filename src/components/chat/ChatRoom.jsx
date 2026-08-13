// React
import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useMessages } from '../../hooks/useMessages';
import { messageService } from '../../services/messageService';
import { friendService } from '../../services/friendService';
import { getDateSeparatorLabel, shouldShowDateSeparator } from '../../utils/dateFormatter';
import { useChatScrollController } from '../../hooks/useChatScrollController';

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

    const [replyingTo, setReplyingTo] = useState(null);
    const [isGroupProfileOpen, setIsGroupProfileOpen] = useState(false);
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

    const [viewingSeenBy, setViewingSeenBy] = useState(null);
    const [viewingReactions, setViewingReactions] = useState(null);
    const [showLoading, setShowLoading] = useState(false);

    const { messages, loading, sendMessage } = useMessages(
        conversation?.id,
        isGroup ? undefined : otherParticipant.uid
    );

    const [optimisticMessages, setOptimisticMessages] = useState([]);

    const allMessages = useMemo(() => {
        if (messages.length === 0 && optimisticMessages.length === 0) return [];
        const realIds = new Set(messages.map(m => m.id));
        const pendingOptimistic = optimisticMessages.filter(m => !realIds.has(m.id));
        const combined = [...messages, ...pendingOptimistic];

        return combined.sort((a, b) => {
            const getTime = (msg) => {
                if (!msg.createdAt) return Date.now();
                if (typeof msg.createdAt.toMillis === 'function') return msg.createdAt.toMillis();
                if (msg.createdAt instanceof Date) return msg.createdAt.getTime();
                return Date.now();
            };
            return getTime(a) - getTime(b);
        });
    }, [messages, optimisticMessages]);

    React.useEffect(() => {
        if (optimisticMessages.length === 0) return;
        const realIds = new Set(messages.map(m => m.id));
        if (optimisticMessages.some(m => realIds.has(m.id))) {
            setOptimisticMessages(prev => prev.filter(m => !realIds.has(m.id)));
        }
    }, [messages, optimisticMessages]);

    React.useEffect(() => {
        let timer;
        if (loading) {
            timer = setTimeout(() => setShowLoading(true), 150);
        } else {
            setShowLoading(false);
        }
        return () => clearTimeout(timer);
    }, [loading]);

    React.useEffect(() => {
        if (isGroup || !user?.uid || !otherParticipant?.uid) return;
        const unsub = friendService.subscribeToFriendshipStatus(
            user.uid,
            otherParticipant.uid,
            (status) => setIsFriend(status === 'FRIENDS')
        );
        return () => unsub();
    }, [user?.uid, otherParticipant?.uid, isGroup]);

    React.useEffect(() => {
        if (!searchQuery.trim()) {
            setMatchingMessageIds([]);
            setSearchIndex(0);
            return;
        }
        const term = searchQuery.toLowerCase();
        const matched = allMessages
            .filter((msg) => msg.text && msg.text.toLowerCase().includes(term) && !msg.isDeleted)
            .map((m) => m.id)
            .reverse();

        setMatchingMessageIds(matched);
        setSearchIndex(0);
        if (matched.length > 0) scrollToMessageId(matched[0]);
    }, [searchQuery, allMessages]);

    const scrollToMessageId = (msgId) => {
        const el = document.getElementById(`msg-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bg-[var(--color-primary)]/15', 'transition-colors', 'duration-700', 'rounded-2xl');
            setTimeout(() => el.classList.remove('bg-[var(--color-primary)]/15'), 1500);
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

    const typingMap = conversation?.typing || {};
    const otherUserUid = isGroup ? null : otherParticipant?.uid;
    const isOtherUserTyping = otherUserUid
        ? Boolean(typingMap[otherUserUid])
        : Object.entries(typingMap).some(([uid, val]) => uid !== user?.uid && val);

    // Connect the decoupled state machine scroll engine
    const {
        chatContainerRef,
        showBottomNavigator,
        handleBadgeClick,
        handleScroll,
        scrollToBottom
    } = useChatScrollController({
        conversationId: conversation?.id,
        user,
        isGroup,
        messages: allMessages,
        loading,
        isOtherUserTyping
    });

    const userSentMessagesCount = useMemo(() => {
        if (isGroup || isFriend) return 0;
        return allMessages.filter(msg => msg.senderId === user?.uid && !msg.isDeleted).length;
    }, [allMessages, isGroup, isFriend, user?.uid]);

    const dbNonFriendCount = conversation.nonFriendMessageCounts?.[user?.uid] || 0;
    const isLimitReached = !isGroup && !isFriend && (dbNonFriendCount >= 5 || userSentMessagesCount >= 5);

    const isLimitReachedRef = useRef(isLimitReached);
    useEffect(() => {
        isLimitReachedRef.current = isLimitReached;
    }, [isLimitReached]);

    const handleSendWithReply = useCallback(
        async (text, replyToMsg) => {
            if (!text.trim()) return;
            if (isLimitReachedRef.current) return;

            const clientMessageId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const optimisticMsg = {
                id: clientMessageId,
                senderId: user.uid,
                text: text.trim(),
                createdAt: new Date(),
                type: 'text',
                deliveryStatus: 'sending',
                isOptimistic: true,
                replyTo: replyToMsg ? {
                    id: replyToMsg.id,
                    text: replyToMsg.text,
                    senderId: replyToMsg.senderId,
                    senderName: isGroup ? conversation.participants?.[replyToMsg.senderId]?.fullName || 'Member' : null,
                } : null
            };

            setOptimisticMessages(prev => [...prev, optimisticMsg]);
            setReplyingTo(null);

            // Optimistic sends always force smooth pan
            scrollToBottom(false);

            try {
                await sendMessage(text, replyToMsg, isFriend, clientMessageId);
            } catch (error) {
                console.error("Failed to send message:", error);
                setOptimisticMessages(prev => prev.filter(m => m.id !== clientMessageId));
            }
        },
        [user, isGroup, conversation, otherParticipant, isFriend, scrollToBottom, sendMessage]
    );

    const handleCancelReply = useCallback(() => setReplyingTo(null), []);

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
        const selectedMsgs = allMessages.filter(m => selectedMessageIds.includes(m.id));
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

    const activeParticipantsMap = isGroup
        ? conversation.participants
        : { [user.uid]: user, [otherParticipant.uid]: otherParticipant };

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-[var(--bg-main)] transition-colors duration-300 overflow-hidden relative">

            {isGroup && (
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
                className="flex-1 overflow-y-auto px-4 pt-4 pb-3 scrollbar-thin relative flex flex-col"
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
                ) : allMessages.length === 0 ? (
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
                        {allMessages.map((msg, index) => {
                            const prevMsg = allMessages[index - 1];
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
                                    <div id={`msg-${msg.id}`} className={`flex-shrink-0 ${msg.isOptimistic ? 'opacity-80' : 'opacity-100'} transition-opacity duration-300`}>
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

                        <AnimatePresence>
                            {isOtherUserTyping && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10, height: 0, marginTop: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, x: 0, height: 'auto', marginTop: 4, marginBottom: 8 }}
                                    exit={{
                                        opacity: 0,
                                        x: -10,
                                        height: 0,
                                        marginTop: 0,
                                        marginBottom: 0,
                                        transition: { duration: 0.25, ease: "easeOut" }
                                    }}
                                    className="flex items-center space-x-2 select-none flex-shrink-0 origin-left overflow-hidden"
                                >
                                    <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] px-4 py-2.5 rounded-2xl rounded-tl-xs shadow-sm flex items-center space-x-1.5 ml-2 w-max">
                                        <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce"></div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showBottomNavigator && (
                    <motion.button
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        onClick={handleBadgeClick}
                        className="absolute bottom-[88px] right-6 w-10 h-10 bg-[var(--color-primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-all z-20 cursor-pointer shadow-xl"
                        title="New messages below"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-[var(--bg-main)]"></span>
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

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