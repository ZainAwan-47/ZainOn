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
    const otherUser = conversation.otherParticipant || {};
    const lastMessage = conversation.lastMessage;
    const unreadCount = conversation.unreadCount || 0;

    const [isFriend, setIsFriend] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Direct listener on user's own friends subcollection (Only for direct chats)
    useEffect(() => {
        if (!user?.uid || !otherUser?.uid || isGroup) return () => { };

        const friendDocRef = doc(db, 'users', user.uid, 'friends', otherUser.uid);
        const unsub = onSnapshot(
            friendDocRef,
            (snap) => {
                setIsFriend(snap.exists());
            },
            (error) => {
                console.warn('[ConversationItem.isFriendCheck]:', error.message);
            }
        );
        return () => unsub();
    }, [user?.uid, otherUser?.uid, isGroup]);

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

    // Soft delete chat handler
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

    // Polymorphic display values
    const displayName = isGroup ? conversation.name : (otherUser.fullName || 'Direct Message');
    const displayAvatar = isGroup ? conversation.avatar : otherUser.photoURL;
    const displayOnline = isGroup ? false : otherUser.isOnline;

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
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3.5 group select-none relative ${isActive ? 'bg-slate-800/90 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20' : 'bg-slate-800/40 hover:bg-slate-800/80 border-transparent hover:border-slate-700/50'} mb-1`}
            >
                <div className="relative shrink-0">
                    <Avatar src={displayAvatar} name={displayName} size="md" isOnline={displayOnline} />
                    {isGroup && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-600 border border-slate-900 rounded-full flex items-center justify-center text-[9px] text-white font-extrabold shadow-sm">
                            #
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold truncate transition-colors ${isActive ? 'text-indigo-300' : 'text-white group-hover:text-indigo-300'}`}>
                            {displayName}
                        </span>
                        {formattedTime && (
                            <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-2">
                                {formattedTime}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2 min-w-0">
                        <p className="text-xs text-slate-400 truncate flex-1 min-w-0">
                            {lastMessage?.text ? (
                                <>
                                    {isOwnLastMessage && <span className="font-bold text-indigo-400 mr-1">You:</span>}
                                    <span>{lastMessage.text}</span>
                                </>
                            ) : (
                                <span className="italic text-slate-500">
                                    {isGroup ? 'Group workspace created' : 'No messages yet'}
                                </span>
                            )}
                        </p>

                        <div className="flex items-center space-x-1.5 shrink-0">
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-[10px] text-white font-extrabold shrink-0 shadow-sm animate-pulse">
                                    {unreadCount}
                                </span>
                            )}

                            {/* Only allow chat soft-deletes on non-friends direct messages */}
                            {!isGroup && !isFriend && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteModal(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer shrink-0"
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