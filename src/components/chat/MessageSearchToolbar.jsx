// React
import React from 'react';

export const MessageSearchToolbar = ({
    query,
    setQuery,
    currentIndex,
    totalMatches,
    onPrev,
    onNext,
    onClose,
}) => {
    return (
        <div className="bg-[var(--bg-surface)] border-b border-[var(--border-color)] px-5 py-2.5 flex items-center justify-between shrink-0 shadow-sm z-30 animate-in slide-in-from-top duration-200 select-none">
            <div className="flex items-center space-x-3 flex-1 max-w-sm">
                <svg className="w-4 h-4 text-[var(--text-secondary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search in chat..."
                    autoFocus
                    className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none"
                />
            </div>

            <div className="flex items-center space-x-3 shrink-0">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    {totalMatches > 0 ? `${currentIndex + 1} of ${totalMatches}` : query.trim() ? 'No matches' : ''}
                </span>

                <div className="flex items-center space-x-1">
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={totalMatches === 0 || currentIndex <= 0}
                        className="p-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] disabled:opacity-30 hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
                        title="Previous match"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={totalMatches === 0 || currentIndex >= totalMatches - 1}
                        className="p-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] disabled:opacity-30 hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
                        title="Next match"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-xl transition-all cursor-pointer ml-2"
                    title="Close Search"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default MessageSearchToolbar;