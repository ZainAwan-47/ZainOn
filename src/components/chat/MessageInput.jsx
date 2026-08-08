// React
import React, { useState, useRef, useEffect, memo } from 'react';

// Components
import EmojiPicker from './EmojiPicker';
import { useAuth } from '../../hooks/useAuth';
import { conversationService } from '../../services/conversationService';

export const MessageInput = memo(({ conversationId, onSend, replyingTo, onCancelReply, disabled = false }) => {
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const enterToSend = user?.chatPrefs?.enterToSend ?? true;

    // Auto-focus textarea when replyingTo changes
    useEffect(() => {
        if (replyingTo && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [replyingTo]);

    const handleInput = (e) => {
        const val = e.target.value;
        setText(val);

        // Trigger typing status indicator
        if (conversationId && user?.uid) {
            conversationService.setTypingStatus(conversationId, user.uid, true);

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                conversationService.setTypingStatus(conversationId, user.uid, false);
            }, 2000);
        }

        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
        }
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || disabled) return;

        // Clear typing status immediately upon submission
        if (conversationId && user?.uid) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            conversationService.setTypingStatus(conversationId, user.uid, false);
        }

        onSend(trimmed, replyingTo);
        setText('');
        if (onCancelReply) onCancelReply();

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (enterToSend && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
            }
        }
    };

    const handleSelectEmoji = (emoji) => {
        setText((prev) => {
            const nextText = prev + emoji;
            setTimeout(() => {
                const textarea = textareaRef.current;
                if (textarea) {
                    textarea.style.height = 'auto';
                    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
                }
            }, 0);
            return nextText;
        });
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex flex-col shrink-0 select-none transition-colors duration-300"
        >
            {showEmojiPicker && (
                <EmojiPicker
                    onSelectEmoji={handleSelectEmoji}
                    onClose={() => setShowEmojiPicker(false)}
                />
            )}

            {replyingTo && (
                <div className="px-4 py-2 bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] flex items-center justify-between space-x-3 text-xs">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <svg className="w-4 h-4 text-[var(--color-primary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <div className="flex flex-col min-w-0 flex-1">
                            {replyingTo.senderName && (
                                <span className="text-[10px] font-semibold text-[var(--color-primary)] opacity-90 mb-0.5">
                                    {replyingTo.senderName}
                                </span>
                            )}
                            <p className="text-[var(--text-primary)] truncate opacity-80">
                                {replyingTo.isDeleted ? 'This message was deleted' : replyingTo.text}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancelReply}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 focus:outline-none transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="p-3 flex items-end space-x-2">
                <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="p-2.5 text-[var(--text-secondary)] hover:text-[var(--color-warning)] bg-[var(--bg-surface-hover)]/60 hover:bg-[var(--bg-surface-hover)] rounded-xl transition-all shrink-0 focus:outline-none cursor-pointer"
                    title="Add Emoji"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

                <div className="flex-1 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded-2xl focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 transition-all px-3.5 py-2">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder={enterToSend ? "Type a message... (Enter to send)" : "Type a message... (Shift+Enter for newline)"}
                        rows={1}
                        disabled={disabled}
                        className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none resize-none max-h-28 scrollbar-thin overflow-y-auto leading-relaxed"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!text.trim() || disabled}
                    className="p-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 focus:outline-none cursor-pointer"
                    title="Send Message"
                >
                    <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
        </div>
    );
});

MessageInput.displayName = 'MessageInput';
export default MessageInput;