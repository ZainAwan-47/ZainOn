// React
import React, { useState } from 'react';

const EMOJI_CATEGORIES = [
    {
        name: 'Frequent',
        emojis: ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉', '👏', '✨', '💯', '😊'],
    },
    {
        name: 'Smileys',
        emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗'],
    },
    {
        name: 'Gestures',
        emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇'],
    },
    {
        name: 'Symbols & Hearts',
        emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
    },
];

export const EmojiPicker = ({ onSelectEmoji, onClose }) => {
    const [activeTab, setActiveTab] = useState('Frequent');

    return (
        <div className="absolute bottom-14 left-2 z-50 w-72 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-3 flex flex-col select-none animate-auth-card">
            {/* Category Tabs */}
            <div className="flex items-center space-x-1 pb-2 border-b border-[var(--border-color)] shrink-0 overflow-x-auto scrollbar-none">
                {EMOJI_CATEGORIES.map((cat) => (
                    <button
                        key={cat.name}
                        type="button"
                        onClick={() => setActiveTab(cat.name)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${activeTab === cat.name
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-6 gap-1 p-2 max-h-48 overflow-y-auto mt-1 scrollbar-thin">
                {EMOJI_CATEGORIES.find((c) => c.name === activeTab)?.emojis.map((emoji, index) => (
                    <button
                        key={`${emoji}-${index}`}
                        type="button"
                        onClick={() => {
                            onSelectEmoji(emoji);
                            onClose && onClose();
                        }}
                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-[var(--bg-surface-hover)] rounded-xl transition-transform hover:scale-125 focus:outline-none active:scale-95"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default EmojiPicker;