// React
import React from 'react';

export const PinnedMessageBanner = ({ pinnedMessage, onUnpin }) => {
    if (!pinnedMessage) return null;

    return (
        <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-900/50 flex items-center justify-between space-x-3 text-xs shrink-0 select-none backdrop-blur-sm">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                <svg
                    className="w-4 h-4 text-indigo-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                </svg>
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                        Pinned Message
                    </span>
                    <p className="text-xs text-slate-200 truncate">{pinnedMessage.text}</p>
                </div>
            </div>

            <button
                type="button"
                onClick={onUnpin}
                className="text-slate-400 hover:text-white text-[11px] font-semibold shrink-0 focus:outline-none"
            >
                Unpin
            </button>
        </div>
    );
};

export default PinnedMessageBanner;