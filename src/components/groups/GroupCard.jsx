// React
import React, { memo } from 'react';

// Hooks
import { useAuth } from '../../hooks/useAuth';

export const GroupCard = memo(({ group, isActive = false, onClick, onViewProfile }) => {
    const { user } = useAuth();
    const groupId = group.id || group.groupId;

    // FIX: Extract unread counter safely
    const unreadCount = group.unreadCounts?.[user?.uid] || 0;

    return (
        <div
            onClick={() => onClick && onClick(groupId)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3.5 group select-none relative ${isActive
                ? 'bg-slate-800/90 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                : 'bg-slate-800/40 hover:bg-slate-800/80 border-transparent hover:border-slate-700/50'
                }`}
        >
            <div className="relative shrink-0">
                <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-10 h-10 rounded-2xl object-cover ring-1 ring-slate-700/60"
                />
                {/* Hash Badge OR Unread Badge */}
                {unreadCount > 0 ? (
                    <div className="absolute -bottom-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 border border-slate-900 rounded-full flex items-center justify-center text-[9px] text-white font-extrabold shadow-sm animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                ) : (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-600 border border-slate-900 rounded-full flex items-center justify-center text-[9px] text-white font-extrabold shadow-sm">
                        #
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <span
                        className={`text-xs font-bold truncate transition-colors ${isActive ? 'text-indigo-300' : 'text-white group-hover:text-indigo-300'
                            }`}
                    >
                        {group.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded-full shrink-0 ml-1">
                        {group.memberCount || group.members?.length || 0} members
                    </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                    <p className={`truncate text-[11px] flex-1 min-w-0 ${unreadCount > 0 ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                        {group.lastMessage?.text || <span className="italic text-slate-500">Group workspace created</span>}
                    </p>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onViewProfile) onViewProfile(group);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg transition-all cursor-pointer shrink-0 ml-1"
                        title="Group Workspace Info"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
});

GroupCard.displayName = 'GroupCard';
export default GroupCard;