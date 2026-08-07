// React
import React, { useState, useRef, useEffect, memo } from 'react';

// Third Party Libraries (Motion)
import { motion } from 'framer-motion';

// Utilities & Components
import { formatMessageTime } from '../../utils/dateFormatter';
import MessageContextMenu from './MessageContextMenu';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';

const SWIPE_UP_SPRING = {
    type: 'spring',
    stiffness: 450,
    damping: 32,
    mass: 0.7,
};

export const MessageBubble = memo(({
    message,
    isOwn = false,
    isGroup = false,
    recipientUid = '',
    currentUid = '',
    onReact,
    onReply,
    onPin,
    onStar,
    isPinned = false,
    onViewSeenBy,
    onViewReactions
}) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [showMenu, setShowMenu] = useState(false);
    const bubbleRef = useRef(null);

    const chatFontSize = user?.chatPrefs?.chatFontSize || 'medium';
    const fontClasses = {
        small: 'text-[11px] px-3.5 py-2',
        medium: 'text-[14px] px-4 py-2.5',
        large: 'text-[17px] px-5 py-3 leading-relaxed',
    };

    const formattedTime = formatMessageTime(message.createdAt);
    const isStarred = Boolean(message.isStarred?.[currentUid]);
    const reactionsMap = message.reactions || {};

    const seenByOthersCount = Array.from(new Set(message.seenBy || [])).filter(uid => uid !== message.senderId).length;

    // Sender's UI reflects reality: if receiver marked it seen, it is green.
    const isSeen = isGroup
        ? Boolean(seenByOthersCount > 0)
        : Boolean(
            (message.seenBy && recipientUid && message.seenBy.includes(recipientUid)) ||
            message.deliveryStatus === 'read'
        );

    const isDelivered = Boolean(
        isSeen ||
        message.deliveryStatus === 'delivered' ||
        (message.seenBy && message.seenBy.length > 1)
    );

    useEffect(() => {
        if (!showMenu) return;

        const handleClickOutside = (event) => {
            if (bubbleRef.current && !bubbleRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showMenu]);

    const handleBubbleClick = (e) => {
        e.stopPropagation();
        setShowMenu((prev) => !prev);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message.text);
        showToast('Message copied to clipboard', 'info');
        setShowMenu(false);
    };

    const motionProfile = isOwn
        ? {
            initial: { opacity: 0, y: 16, scale: 0.98 },
            animate: { opacity: 1, y: 0, scale: 1 },
            transition: SWIPE_UP_SPRING,
        }
        : {
            initial: { opacity: 0, y: 14, scale: 0.98 },
            animate: { opacity: 1, y: 0, scale: 1 },
            transition: SWIPE_UP_SPRING,
        };

    return (
        <motion.div
            ref={bubbleRef}
            initial={motionProfile.initial}
            animate={motionProfile.animate}
            transition={motionProfile.transition}
            className={`relative flex flex-col my-1 group select-none ${isOwn ? 'items-end' : 'items-start'}`}
            style={{ willChange: 'transform, opacity' }}
        >
            {showMenu && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute -top-12 z-30 transition-all ${isOwn ? 'right-0' : 'left-0'}`}
                >
                    <MessageContextMenu
                        onReact={(emoji) => {
                            onReact(message.id, emoji);
                            setShowMenu(false);
                        }}
                        onReply={() => {
                            onReply(message);
                            setShowMenu(false);
                        }}
                        onCopy={handleCopy}
                        onPin={() => {
                            onPin(message);
                            setShowMenu(false);
                        }}
                        onStar={() => {
                            onStar(message.id, message.isStarred);
                            setShowMenu(false);
                        }}
                        isPinned={isPinned}
                        isStarred={isStarred}
                        isOwn={isOwn}
                    />
                </div>
            )}

            <div
                onClick={handleBubbleClick}
                className={`max-w-[75%] sm:max-w-[65%] rounded-2xl ${fontClasses[chatFontSize]} break-words shadow-sm transition-all cursor-pointer relative ${isOwn
                    ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-tr-xs'
                    : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-xs'
                    } ${showMenu ? 'ring-2 ring-[var(--color-primary)]/50 shadow-[var(--color-primary)]/20' : ''}`}
            >
                {message.replyTo && (
                    <div
                        className={`mb-2 p-2 rounded-xl text-[11px] border-l-2 ${isOwn
                            ? 'bg-black/20 border-white/40 text-white/90'
                            : 'bg-[var(--bg-main)] border-[var(--color-primary)] text-[var(--text-secondary)]'
                            }`}
                    >
                        <span className="font-bold text-[10px] block opacity-80">
                            {message.replyTo.senderName || 'Replied Message'}
                        </span>
                        <p className="truncate opacity-90">{message.replyTo.text}</p>
                    </div>
                )}

                <p className="whitespace-pre-wrap">{message.text}</p>

                <div
                    className={`flex items-center justify-end space-x-1.5 mt-1 text-[9px] font-medium ${isOwn ? 'text-white/70' : 'text-[var(--text-secondary)]'
                        }`}
                >
                    {isStarred && (
                        <svg className="w-2.5 h-2.5 text-[var(--color-warning)] fill-current" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                    )}

                    <span>{formattedTime}</span>

                    {isOwn && (
                        <div
                            className="flex items-center pl-0.5"
                            onClick={(e) => {
                                if (isGroup) {
                                    e.stopPropagation();
                                    onViewSeenBy(message);
                                }
                            }}
                        >
                            {isGroup ? (
                                isSeen ? (
                                    <span className="hover:text-white transition-colors">
                                        Seen by {seenByOthersCount}
                                    </span>
                                ) : (
                                    <span className="hover:text-white transition-colors">Sent</span>
                                )
                            ) : (
                                isSeen ? (
                                    <span className="w-2 h-2 rounded-full bg-[var(--color-success)] ring-2 ring-[var(--color-success)]/30" title="Seen" />
                                ) : isDelivered ? (
                                    <span className="w-2 h-2 rounded-full bg-[var(--color-warning)] ring-2 ring-[var(--color-warning)]/30" title="Delivered" />
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-[var(--text-secondary)] ring-2 ring-[var(--text-secondary)]/20" title="Sent" />
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {Object.keys(reactionsMap).length > 0 && (
                <div
                    className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                    {Object.entries(reactionsMap).map(([emoji, userIds]) => {
                        const count = userIds.length;
                        const hasReacted = userIds.includes(currentUid);
                        return (
                            <button
                                key={emoji}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewReactions(message);
                                }}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 transition-all active:scale-95 cursor-pointer ${hasReacted
                                    ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-[var(--color-primary)]'
                                    : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                <span>{emoji}</span>
                                {count > 1 && <span>{count}</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
});

MessageBubble.displayName = 'MessageBubble';
export default MessageBubble;