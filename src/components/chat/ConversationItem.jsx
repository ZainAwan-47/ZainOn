// React
import React, { useState, useEffect, memo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

// Services & Firebase
import { db } from '../../firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { conversationService } from '../../services/conversationService';
import Avatar from '../ui/Avatar';
import DeleteChatModal from './DeleteChatModal';
import { useToast } from '../../context/ToastContext';

export const ConversationItem = memo(({
    conversation,
    isActive = false,
    onClick,
    onDeleted,
}) => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const isGroup = conversation.type === 'group';
    const otherParticipantUid = conversation.otherParticipant?.uid;
    const lastMessage = conversation.lastMessage;
    const unreadCount = conversation.unreadCount || 0;
    const messagePreviewEnabled = user?.chatPrefs?.messagePreview ?? true;

    const [liveOtherUser, setLiveOtherUser] = useState(conversation.otherParticipant || {});
    const [isFriend, setIsFriend] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Live Snapshot Listener for Target User (Respects Privacy Settings instantly in sidebar)
    useEffect(() => {
        if (isGroup || !otherParticipantUid) return;
        const unsub = onSnapshot(doc(db, 'users', otherParticipantUid), (docSnap) => {
            if (docSnap.exists()) {
                setLiveOtherUser({ uid: docSnap.id, ...docSnap.data() });
            }
        });
        return () => unsub();
    }, [isGroup, otherParticipantUid]);

    // Check Friendship
    useEffect(() => {
        if (!user?.uid || !otherParticipantUid || isGroup) return () => { };
        const friendDocRef = doc(db, 'users', user.uid, 'friends', otherParticipantUid);
        const unsub = onSnapshot(friendDocRef, (snap) => setIsFriend(snap.exists()));
        return () => unsub();
    }, [user?.uid, otherParticipantUid, isGroup]);

    const isOwnLastMessage = Boolean(
        lastMessage?.senderId && user?.uid && lastMessage.senderId === user.uid
    );

    const rawTimestamp = conversation.lastActivity || conversation.createdAt;
    let formattedTime = '';
    if (rawTimestamp?.toDate) {
        const date = rawTimestamp.toDate();
        const now = new Date();
        if (now.toDateString() === date.toDateString()) {
            formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } else {
            formattedTime = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    const handleDeleteChat = async () => {
        if (!conversation.id || !user?.uid) return;
        try {
            await conversationService.hideConversationForUser(conversation.id, user.uid);
            showToast('Conversation removed from your chats', 'info');
            setShowDeleteModal(false);
            if (onDeleted) onDeleted(conversation.id);
        } catch (error) {
            console.error('[handleDeleteChat]:', error);
            showToast('Failed to remove conversation.', 'error');
        }
    };

    const displayName = isGroup ? conversation.name : (liveOtherUser.fullName || 'Direct Message');
    const displayAvatar = isGroup ? conversation.avatar : liveOtherUser.photoURL;

    // Check if the other user has onlineStatus turned off in real-time
    const onlineStatusEnabled = liveOtherUser.privacy?.onlineStatus !== false;
    const displayOnline = isGroup ? false : (onlineStatusEnabled ? liveOtherUser.isOnline : false);

    return (
        <>
            <DeleteChatModal
                isOpen={showDeleteModal}
                recipientName={displayName}
                onConfirm={handleDeleteChat}
                onCancel={() => setShowDeleteModal(false)}
            />
            <div
                onClick={onClick}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3.5 group select-none relative ${isActive ? 'bg-[var(--bg-surface-hover)] border-[var(--color-primary)]/50 shadow-md ring-1 ring-[var(--color-primary)]/20' : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border-transparent hover:border-[var(--border-color)]'} mb-1`}
            >
                <div className="relative shrink-0">
                    <Avatar src={displayAvatar} name={displayName} size="md" isOnline={displayOnline} />
                    {isGroup && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--color-primary)] border border-[var(--bg-main)] rounded-full flex items-center justify-center text-[9px] text-white font-extrabold shadow-sm">
                            #
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold truncate transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)] group-hover:text-[var(--color-primary)]'}`}>
                            {displayName}
                        </span>
                        {formattedTime && (
                            <span className="text-[10px] font-medium text-[var(--text-secondary)] shrink-0 ml-2">
                                {formattedTime}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2 min-w-0">
                        <p className="text-xs text-[var(--text-secondary)] truncate flex-1 min-w-0">
                            {messagePreviewEnabled ? (
                                lastMessage?.text ? (
                                    <>
                                        {isOwnLastMessage && <span className="font-bold text-[var(--color-primary)] mr-1">You:</span>}
                                        <span>{lastMessage.text}</span>
                                    </>
                                ) : (
                                    <span className="italic opacity-70">
                                        {isGroup ? 'Group workspace created' : 'No messages yet'}
                                    </span>
                                )
                            ) : (
                                <span className="italic opacity-70">New message</span>
                            )}
                        </p>

                        <div className="flex items-center space-x-1.5 shrink-0">
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[var(--color-primary)] text-[10px] text-white font-extrabold shrink-0 shadow-sm animate-pulse">
                                    {unreadCount}
                                </span>
                            )}

                            {!isGroup && !isFriend && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteModal(true);
                                    }}
                                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-all cursor-pointer shrink-0"
                                    title="Remove Conversation"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
});

ConversationItem.displayName = 'ConversationItem';
export default ConversationItem;