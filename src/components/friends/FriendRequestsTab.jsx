// React
import React from 'react';

// Components
import Avatar from '../ui/Avatar';

export const FriendRequestsTab = ({
    requests = [],
    onAccept,
    onDecline,
}) => {
    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 select-none">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-center text-slate-400 mb-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <span className="text-xs font-bold text-slate-300">No Pending Requests</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                    You have no incoming friend requests right now.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-1.5 pt-0.5 select-none">
            <div className="px-1 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Incoming Requests</span>
                <span className="bg-indigo-600 px-2 py-0.5 rounded-full text-[10px] text-white font-bold">
                    {requests.length}
                </span>
            </div>

            {requests.map((req) => (
                <div
                    key={req.id}
                    className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 flex items-center justify-between space-x-3"
                >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <Avatar
                            src={req.senderProfile?.photoURL}
                            name={req.senderProfile?.fullName || 'User'}
                            size="md"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-white truncate">
                                {req.senderProfile?.fullName || 'User'}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 truncate">
                                @{req.senderProfile?.username || 'user'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => onAccept(req.id, req.senderUid)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-xl shadow-sm transition-all active:scale-95"
                        >
                            Accept
                        </button>
                        <button
                            type="button"
                            onClick={() => onDecline(req.id)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-900/40 font-bold text-[11px] rounded-xl transition-all active:scale-95"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FriendRequestsTab;