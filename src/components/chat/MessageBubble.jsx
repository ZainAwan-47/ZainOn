// React
import React, { useRef, useEffect, useState, memo } from 'react';

// Third Party Libraries (Motion)
import { motion } from 'framer-motion';

// Utilities & Components
import { formatMessageTime } from '../../utils/dateFormatter';
import MessageContextMenu from './MessageContextMenu';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';

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
    onDelete,
    onEditSubmit,
    isPinned = false,
    isMultiSelectMode = false,
    isSelected = false,
    onToggleSelect,
    onViewSeenBy,
    onViewReactions,
    searchQuery = '',
    onScrollToMessage,
    isEditing = false,
    onStartEdit,
    onCancelEdit,
    isAnyEditingActive = false,
}) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [showMenu, setShowMenu] = useState(false);
    const [editText, setEditText] = useState(message.text || '');
    const bubbleRef = useRef(null);
    const editInputRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (isEditing) {
            const textVal = message.text || '';
            setEditText(textVal);

            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (containerRef.current) {
                        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 100);

                if (editInputRef.current) {
                    editInputRef.current.focus();
                    editInputRef.current.setSelectionRange(textVal.length, textVal.length);
                }
            });
        }
    }, [isEditing, message.text]);

    useEffect(() => {
        if (!showMenu) return;

        requestAnimationFrame(() => {
            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 100);
        });
    }, [showMenu]);

    const chatFontSize = user?.chatPrefs?.chatFontSize || 'medium';
    const fontClasses = {
        small: 'text-[11px] px-3.5 py-2',
        medium: 'text-[14px] px-4 py-2.5',
        large: 'text-[17px] px-5 py-3 leading-relaxed',
    };

    const formattedTime = formatMessageTime(message.createdAt);
    const isStarred = Boolean(message.isStarred?.[currentUid]);
    const reactionsMap = message.reactions || {};

    const canEdit = (() => {
        if (message.senderId !== currentUid || message.isDeleted) return false;
        const ts = message.createdAt;
        const millis = ts?.toMillis ? ts.toMillis() : (ts ? new Date(ts).getTime() : null);
        if (!millis) return false;
        return Date.now() - millis <= 105000;
    })();

    const seenByOthersCount = Array.from(new Set(message.seenBy || [])).filter(uid => uid !== message.senderId).length;

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
        if (isMultiSelectMode || isEditing) return;
        setShowMenu((prev) => !prev);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message.text);
        showToast('Message copied to clipboard', 'info');
        setShowMenu(false);
    };

    const renderHighlightedText = (text) => {
        if (!searchQuery.trim() || !text) return text;
        const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
                <span key={i} className="bg-yellow-400 text-black font-bold px-0.5 rounded">
                    {part}
                </span>
            ) : (
                part
            )
        );
    };

    const spotlightClasses = isAnyEditingActive
        ? isEditing
            ? 'relative z-50 scale-[1.02] transition-all duration-300 mb-12'
            : 'filter blur-[2px] opacity-30 pointer-events-none transition-all duration-300'
        : '';

    return (
        <motion.div
            ref={containerRef}
            // THE ULTIMATE "AIRY & BUTTER" LOGIC:
            // 1. Reduced 'y' distance so it glides naturally without feeling dragged.
            // 2. Property-specific transitions: Height uses a buttery Bezier curve to push older messages up linearly.
            // 3. Transform (Y/Scale) uses a lightweight, airy spring to float into the reserved space.
            initial={{
                opacity: 0,
                height: 0,
                marginTop: 0,
                marginBottom: 0,
                y: 20, // Reduced from 35 for a lighter, less forced travel distance
                scale: 0.9
            }}
            animate={{
                opacity: 1,
                height: 'auto',
                marginTop: 4,
                marginBottom: 4,
                y: 0,
                scale: 1
            }}
            exit={{
                opacity: 0,
                height: 0,
                marginTop: 0,
                marginBottom: 0,
                scale: 0.9,
                transition: { duration: 0.2, ease: "easeIn" }
            }}
            transition={{
                // 1. DOM Layout: Time-based bezier curve. Perfectly smoothly pushes old messages up. ZERO Layout Thrashing.
                height: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
                marginTop: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
                marginBottom: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
                opacity: { duration: 0.25 },

                // 2. Visual Float: A much lighter, airier spring for that weightless glide-in feel.
                default: {
                    type: "spring",
                    stiffness: 180,
                    damping: 18,
                    mass: 0.6 // Lighter mass makes it feel effortless and airy
                }
            }}
            style={{
                overflow: showMenu ? 'visible' : 'hidden',
                transformOrigin: isOwn ? 'bottom right' : 'bottom left'
            }}
            className={`flex items-center space-x-2 group select-none ${isOwn ? 'flex-row-reverse space-x-reverse justify-start' : 'justify-start'} ${spotlightClasses}`}
        >
            {isMultiSelectMode && !message.isDeleted && (
                <div className="px-2">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(message.id)}
                        className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                    />
                </div>
            )}

            <div
                ref={bubbleRef}
                className={`relative flex flex-col group select-none flex-1 ${isOwn ? 'items-end' : 'items-start'}`}
            >
                {showMenu && !isMultiSelectMode && !isEditing && (
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
                            onEdit={() => {
                                setShowMenu(false);
                                if (onStartEdit) onStartEdit(message.id);
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
                            onDelete={() => {
                                onDelete(message);
                                setShowMenu(false);
                            }}
                            isPinned={isPinned}
                            isStarred={isStarred}
                            isDeleted={message.isDeleted}
                            canEdit={canEdit}
                            reactions={reactionsMap}
                            currentUid={currentUid}
                        />
                    </div>
                )}

                <div
                    onClick={handleBubbleClick}
                    className={`max-w-[75%] sm:max-w-[65%] rounded-2xl ${fontClasses[chatFontSize]} break-words shadow-sm transition-all cursor-pointer relative ${message.isDeleted
                        ? 'italic text-[var(--text-secondary)] bg-[var(--bg-surface-hover)] border border-[var(--border-color)]'
                        : isOwn
                            ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-tr-xs'
                            : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-xs'
                        }`}
                >
                    {!message.isDeleted && message.replyTo && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                if (message.replyTo.id && onScrollToMessage) {
                                    onScrollToMessage(message.replyTo.id);
                                }
                            }}
                            className={`mb-2 p-2 rounded-xl text-[11px] border-l-2 cursor-pointer hover:opacity-100 transition-opacity ${isOwn
                                ? 'bg-black/20 border-white/40 text-white/90'
                                : 'bg-[var(--bg-main)] border-[var(--color-primary)] text-[var(--text-secondary)]'
                                }`}
                            title="Jump to original message"
                        >
                            {isGroup && message.replyTo.senderName && (
                                <span className="font-bold text-[10px] block opacity-80 mb-0.5">
                                    {message.replyTo.senderName}
                                </span>
                            )}
                            <p className="truncate opacity-90">
                                {message.replyTo.isDeleted ? 'This message was deleted' : message.replyTo.text}
                            </p>
                        </div>
                    )}

                    {isEditing ? (
                        <div className="flex flex-col space-y-2 w-full min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                            <textarea
                                ref={editInputRef}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full bg-black/20 text-white p-2 rounded-xl text-xs focus:outline-none resize-none"
                                rows={2}
                            />
                            <div className="flex items-center justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={onCancelEdit}
                                    className="px-2.5 py-1 bg-black/30 text-white/80 rounded-lg text-[10px] font-semibold hover:bg-black/40"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (editText.trim()) {
                                            onEditSubmit(message.id, editText.trim());
                                        }
                                    }}
                                    className="px-2.5 py-1 bg-white text-[var(--color-primary)] rounded-lg text-[10px] font-bold shadow hover:bg-white/90"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="whitespace-pre-wrap">{renderHighlightedText(message.text)}</p>
                    )}

                    {!isEditing && (
                        <div
                            className={`flex items-center justify-end space-x-1.5 mt-1 text-[9px] font-medium ${isOwn ? 'text-white/70' : 'text-[var(--text-secondary)]'
                                }`}
                        >
                            {message.isEdited && <span className="italic opacity-80">(edited)</span>}

                            {isStarred && !message.isDeleted && (
                                <svg className="w-2.5 h-2.5 text-[var(--color-warning)] fill-current" viewBox="0 0 24 24">
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                            )}

                            <span>{formattedTime}</span>

                            {isOwn && !message.isDeleted && (
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
                                            <span className="w-2 h-2 rounded-full bg-[var(--color-success)] ring-2 ring-[var(--color-success)]/30 inline-block" title="Seen" />
                                        ) : isDelivered ? (
                                            <span className="w-2 h-2 rounded-full bg-[var(--color-warning)] ring-2 ring-[var(--color-warning)]/30 inline-block" title="Delivered" />
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-[var(--text-secondary)] ring-2 ring-[var(--text-secondary)]/20 inline-block" title="Sent" />
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {Object.keys(reactionsMap).length > 0 && !isEditing && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(reactionsMap).map(([emoji, userIds]) => {
                            const count = userIds.length;
                            const hasReacted = userIds.includes(currentUid);
                            return (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onViewReactions) onViewReactions(message);
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
            </div>
        </motion.div>
    );
});

MessageBubble.displayName = 'MessageBubble';
export default MessageBubble;