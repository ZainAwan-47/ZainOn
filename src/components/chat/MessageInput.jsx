// React
import React, { useState, useRef, memo } from 'react';

// Components
import EmojiPicker from './EmojiPicker';
import { useAuth } from '../../hooks/useAuth';

export const MessageInput = memo(({ onSend, replyingTo, onCancelReply, disabled = false }) => {
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const textareaRef = useRef(null);

    const enterToSend = user?.chatPrefs?.enterToSend ?? true;

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || disabled) return;

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
            // If enterToSend is false, or if shiftKey is pressed, 
            // we do nothing here so the textarea naturally inserts a newline.
        }
    };

    const handleSelectEmoji = (emoji) => {
        setText((prev) => prev + emoji);
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
                            <span className="text-[10px] font-bold text-[var(--color-primary)] opacity-90">
                                Replying to {replyingTo.senderName || 'User'}
                            </span>
                            <p className="text-[var(--text-primary)] truncate opacity-80">{replyingTo.text}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancelReply}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 focus:outline-none transition-colors"
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
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={enterToSend ? "Type a message... (Enter to send)" : "Type a message... (Shift+Enter for newline)"}
                        rows={1}
                        disabled={disabled}
                        className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none resize-none max-h-28 scrollbar-thin"
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