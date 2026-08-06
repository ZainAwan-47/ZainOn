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
                <div className="w-7 h-7 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-400">Searching users...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-center space-y-1">
                <p className="text-xs font-bold text-rose-300">Search Error</p>
                <p className="text-[11px] text-rose-400/90">{error}</p>
            </div>
        );
    }

    if (!searchQuery.trim()) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 select-none">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 mb-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
                <span className="text-xs font-bold text-slate-300">Search for Users</span>
                <p className="text-[11px] text-slate-400 leading-normal max-w-[220px]">
                    Type a name or username to find people across ZainOn.
                </p>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 select-none">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-center text-slate-400 mb-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
                <span className="text-xs font-bold text-slate-300">No Users Found</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                    No user matched &quot;<span className="text-white font-semibold">{searchQuery}</span>&quot;
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-1.5 p-0.5">
            <div className="px-1 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Search Results</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[10px] text-indigo-400 font-bold">
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