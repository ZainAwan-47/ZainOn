// React
import React, { useState, useRef, useEffect, memo } from 'react';

// Third Party Libraries (Motion)
import { motion } from 'framer-motion';

// Utilities & Components
import { formatMessageTime } from '../../utils/dateFormatter';
import MessageContextMenu from './MessageContextMenu';
import { useToast } from '../../context/ToastContext';

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
    recipientIsOnline = false,
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
    const { showToast } = useToast();
    const [showMenu, setShowMenu] = useState(false);
    const bubbleRef = useRef(null);

    const formattedTime = formatMessageTime(message.createdAt);
    const isStarred = Boolean(message.isStarred?.[currentUid]);
    const reactionsMap = message.reactions || {};

    // Strict deduplication: calculate exactly how many unique OTHER people saw this
    const seenByOthersCount = Array.from(new Set(message.seenBy || [])).filter(uid => uid !== message.senderId).length;

    // Monotonic Read Receipts - Strictly derived from persisted document status
    const isSeen = isGroup
        ? Boolean(seenByOthersCount > 0)
        : Boolean(
            (message.seenBy && recipientUid && message.seenBy.includes(recipientUid)) ||
            message.deliveryStatus === 'read'
        );

    // Recipient presence is intentionally excluded so delivered status is 100% irreversible
    const isDelivered = Boolean(
        isSeen ||
        message.deliveryStatus === 'delivered' ||
        (message.seenBy && message.seenBy.length > 1)
    );

    // Click-Outside & Escape Listener
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
            className={`relative flex flex-col my-1 group select-none ${isOwn ? 'items-end' : 'items-start'
                }`}
            style={{ willChange: 'transform, opacity' }}
        >
            {/* Floating Action Context Menu */}
            {showMenu && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute -top-12 z-30 transition-all ${isOwn ? 'right-0' : 'left-0'
                        }`}
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

            {/* Message Text Bubble */}
            <div
                onClick={handleBubbleClick}
                className={`max-w-[75%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-sm transition-all cursor-pointer relative ${isOwn
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white rounded-tr-xs'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700/60 rounded-tl-xs'
                    } ${showMenu ? 'ring-2 ring-indigo-400/50 shadow-indigo-500/20' : ''
                    }`}
            >
                {message.replyTo && (
                    <div
                        className={`mb-2 p-2 rounded-xl text-[11px] border-l-2 ${isOwn
                            ? 'bg-indigo-700/60 border-indigo-300 text-indigo-100'
                            : 'bg-slate-900/60 border-indigo-500 text-slate-300'
                            }`}
                    >
                        <span className="font-bold text-[10px] block opacity-80">
                            {message.replyTo.senderName || 'Replied Message'}
                        </span>
                        <p className="truncate">{message.replyTo.text}</p>
                    </div>
                )}

                <p className="whitespace-pre-wrap">{message.text}</p>

                <div
                    className={`flex items-center justify-end space-x-1.5 mt-1 text-[9px] font-medium ${isOwn ? 'text-indigo-200/80' : 'text-slate-400'
                        }`}
                >
                    {isStarred && (
                        <svg className="w-2.5 h-2.5 text-amber-400 fill-current" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                    )}

                    <span>{formattedTime}</span>

                    {/* Enhanced Tri-State Read Receipts */}
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
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" title="Seen" />
                                ) : isDelivered ? (
                                    <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30" title="Delivered" />
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-slate-400 ring-2 ring-slate-400/20" title="Sent" />
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Emoji Reactions Pill Bar */}
            {Object.keys(reactionsMap).length > 0 && (
                <div
                    className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'
                        }`}
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
                                    ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
                                    : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700'
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