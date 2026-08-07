// React
import React from 'react';

// Components
import SearchResultCard from './SearchResultCard';

export const UserSearchResults = ({
    results = [],
    isSearching = false,
    error = '',
    searchQuery = '',
    onViewProfile,
}) => {
    if (isSearching) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-7 h-7 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-[var(--text-secondary)]">Searching users...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-center space-y-1">
                <p className="text-xs font-bold text-[var(--color-danger)]">Search Error</p>
                <p className="text-[11px] text-[var(--text-secondary)]">{error}</p>
            </div>
        );
    }

    if (!searchQuery.trim()) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 select-none">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] mb-1 shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">Search for Users</span>
                <p className="text-[11px] text-[var(--text-secondary)] leading-normal max-w-[220px]">
                    Type a name or username to find people across ZainOn.
                </p>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 select-none">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] mb-1 shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">No Users Found</span>
                <p className="text-[11px] text-[var(--text-secondary)] leading-normal">
                    No user matched &quot;<span className="text-[var(--text-primary)] font-semibold">{searchQuery}</span>&quot;
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-1.5 p-0.5">
            <div className="px-1 py-1 flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                <span>Search Results</span>
                <span className="bg-[var(--bg-surface)] border border-[var(--border-color)] px-2 py-0.5 rounded-full text-[10px] text-[var(--color-primary)] font-bold">
                    {results.length}
                </span>
            </div>
            {results.map((foundUser) => (
                <SearchResultCard
                    key={foundUser.uid}
                    user={foundUser}
                    onViewProfile={onViewProfile}
                />
            ))}
        </div>
    );
};

export default UserSearchResults;