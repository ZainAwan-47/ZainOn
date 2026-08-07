// React
import React from 'react';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessageContextMenu = ({
    onReact,
    onReply,
    onCopy,
    onPin,
    onStar,
    isPinned = false,
    isStarred = false,
}) => {
    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-xl p-1.5 backdrop-blur-md select-none space-y-1 animate-auth-card"
        >
            {/* Quick Emoji Reaction Bar */}
            <div className="flex items-center space-x-1 pb-1 border-b border-[var(--border-color)] px-1">
                {QUICK_REACTIONS.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onReact(emoji);
                        }}
                        className="w-7 h-7 flex items-center justify-center text-sm hover:bg-[var(--bg-surface-hover)] rounded-lg transition-transform hover:scale-125 focus:outline-none active:scale-95 cursor-pointer"
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Context Action Buttons */}
            <div className="flex items-center space-x-1 px-0.5">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onReply();
                    }}
                    className="p-1.5 hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--color-primary)] rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-colors active:scale-95 cursor-pointer"
                    title="Reply"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="hidden sm:inline">Reply</span>
                </button>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCopy();
                    }}
                    className="p-1.5 hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--color-primary)] rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-colors active:scale-95 cursor-pointer"
                    title="Copy"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline">Copy</span>
                </button>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPin();
                    }}
                    className={`p-1.5 hover:bg-[var(--bg-surface-hover)] rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-colors active:scale-95 cursor-pointer ${isPinned ? 'text-[var(--color-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--color-primary)]'
                        }`}
                    title={isPinned ? 'Unpin' : 'Pin'}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span className="hidden sm:inline">{isPinned ? 'Pinned' : 'Pin'}</span>
                </button>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onStar();
                    }}
                    className={`p-1.5 hover:bg-[var(--bg-surface-hover)] rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-colors active:scale-95 cursor-pointer ${isStarred ? 'text-[var(--color-warning)]' : 'text-[var(--text-secondary)] hover:text-[var(--color-warning)]'
                        }`}
                    title={isStarred ? 'Unstar' : 'Star'}
                >
                    <svg
                        className="w-3.5 h-3.5"
                        fill={isStarred ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="hidden sm:inline">Star</span>
                </button>
            </div>
        </div>
    );
};

export default MessageContextMenu;